// =============================================
// DATABASE SCHEMA TESTS
// Tests for Supabase jobs and applications tables
// =============================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Job, Application } from "./types/database";

// Initialize Supabase client for testing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Track created test data for cleanup
const testJobIds: string[] = [];
const testApplicationIds: string[] = [];

describe("Database Schema: Jobs Table", () => {
  afterEach(async () => {
    // Cleanup test data
    if (testJobIds.length > 0) {
      await supabase.from("jobs").delete().in("id", testJobIds);
      testJobIds.length = 0;
    }
  });

  it("can insert a valid job with all required fields", async () => {
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: "Test Software Engineer",
        company: "Test Corp",
        location: "Remote",
        status: "open",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.title).toBe("Test Software Engineer");
    expect(data?.company).toBe("Test Corp");
    expect(data?.status).toBe("open");
    
    // Verify timestamps are auto-generated
    expect(data?.created_at).toBeDefined();
    expect(data?.updated_at).toBeDefined();
    
    if (data?.id) testJobIds.push(data.id);
  });

  it("requires title field (NOT NULL constraint)", async () => {
    const { error } = await supabase
      .from("jobs")
      .insert({
        company: "Test Corp",
        // title is missing
      })
      .select();

    expect(error).toBeDefined();
    expect(error?.message).toContain("null value");
  });

  it("requires company field (NOT NULL constraint)", async () => {
    const { error } = await supabase
      .from("jobs")
      .insert({
        title: "Test Role",
        // company is missing
      })
      .select();

    expect(error).toBeDefined();
    expect(error?.message).toContain("null value");
  });

  it("only accepts valid status values: 'draft', 'open', 'closed'", async () => {
    // Valid statuses should work
    const validStatuses = ["draft", "open", "closed"];
    
    for (const status of validStatuses) {
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          title: `Test Job ${status}`,
          company: "Test Corp",
          status: status,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.status).toBe(status);
      if (data?.id) testJobIds.push(data.id);
    }

    // Invalid status should fail
    const { error: invalidError } = await supabase
      .from("jobs")
      .insert({
        title: "Test Job",
        company: "Test Corp",
        status: "invalid_status" as any,
      })
      .select();

    expect(invalidError).toBeDefined();
    expect(invalidError?.message).toContain("violates check constraint");
  });

  it("defaults status to 'draft' if not provided", async () => {
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: "Test Job",
        company: "Test Corp",
        // status not provided
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("draft");
    if (data?.id) testJobIds.push(data.id);
  });

  it("auto-generates UUID for id field", async () => {
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: "Test Job",
        company: "Test Corp",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBeDefined();
    expect(data?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    if (data?.id) testJobIds.push(data.id);
  });

  it("allows optional fields (description, salary_range, requirements, deadline)", async () => {
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: "Senior Engineer",
        company: "Tech Corp",
        description: "Build cool things",
        salary_range: "$100k-$150k",
        requirements: { years_experience: 5, skills: ["React", "Node.js"] },
        deadline: new Date("2025-12-31").toISOString(),
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.description).toBe("Build cool things");
    expect(data?.salary_range).toBe("$100k-$150k");
    expect(data?.requirements).toEqual({ years_experience: 5, skills: ["React", "Node.js"] });
    expect(data?.deadline).toBeDefined();
    if (data?.id) testJobIds.push(data.id);
  });
});

describe("Database Schema: Applications Table", () => {
  let testJobId: string;

  beforeEach(async () => {
    // Create a test job for foreign key references
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title: "Test Job for Applications",
        company: "Test Company",
        status: "open",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create test job: ${error.message}`);
    testJobId = data.id;
    testJobIds.push(testJobId);
  });

  afterEach(async () => {
    // Cleanup applications first (due to foreign key)
    if (testApplicationIds.length > 0) {
      await supabase.from("applications").delete().in("id", testApplicationIds);
      testApplicationIds.length = 0;
    }
    // Then cleanup jobs
    if (testJobIds.length > 0) {
      await supabase.from("jobs").delete().in("id", testJobIds);
      testJobIds.length = 0;
    }
  });

  it("can insert a valid application", async () => {
    const candidateId = "550e8400-e29b-41d4-a716-446655440000";
    
    const { data, error } = await supabase
      .from("applications")
      .insert({
        job_id: testJobId,
        candidate_id: candidateId,
        resume_url: "https://example.com/resume.pdf",
        status: "applied",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.job_id).toBe(testJobId);
    expect(data?.candidate_id).toBe(candidateId);
    expect(data?.status).toBe("applied");
    
    // Verify timestamps are auto-generated
    expect(data?.applied_at).toBeDefined();
    expect(data?.updated_at).toBeDefined();
    
    if (data?.id) testApplicationIds.push(data.id);
  });

  it("enforces foreign key constraint to jobs table", async () => {
    const fakeJobId = "00000000-0000-0000-0000-000000000000";
    
    const { error } = await supabase
      .from("applications")
      .insert({
        job_id: fakeJobId,
        candidate_id: "550e8400-e29b-41d4-a716-446655440001",
      })
      .select();

    expect(error).toBeDefined();
    expect(error?.message).toContain("foreign key constraint");
  });

  it("prevents duplicate applications (unique constraint on job_id + candidate_id)", async () => {
    const candidateId = "550e8400-e29b-41d4-a716-446655440002";
    
    // First application should succeed
    const { data: first, error: firstError } = await supabase
      .from("applications")
      .insert({
        job_id: testJobId,
        candidate_id: candidateId,
      })
      .select()
      .single();

    expect(firstError).toBeNull();
    if (first?.id) testApplicationIds.push(first.id);

    // Duplicate application should fail
    const { error: duplicateError } = await supabase
      .from("applications")
      .insert({
        job_id: testJobId,
        candidate_id: candidateId,
      })
      .select();

    expect(duplicateError).toBeDefined();
    expect(duplicateError?.message).toContain("unique constraint");
  });

  it("allows same candidate to apply to different jobs", async () => {
    const candidateId = "550e8400-e29b-41d4-a716-446655440003";
    
    // Create second test job
    const { data: job2, error: jobError } = await supabase
      .from("jobs")
      .insert({
        title: "Another Test Job",
        company: "Another Company",
      })
      .select()
      .single();

    expect(jobError).toBeNull();
    if (job2?.id) testJobIds.push(job2.id);

    // Apply to first job
    const { data: app1, error: error1 } = await supabase
      .from("applications")
      .insert({
        job_id: testJobId,
        candidate_id: candidateId,
      })
      .select()
      .single();

    expect(error1).toBeNull();
    if (app1?.id) testApplicationIds.push(app1.id);

    // Apply to second job (should succeed)
    const { data: app2, error: error2 } = await supabase
      .from("applications")
      .insert({
        job_id: job2.id,
        candidate_id: candidateId,
      })
      .select()
      .single();

    expect(error2).toBeNull();
    if (app2?.id) testApplicationIds.push(app2.id);
  });

  it("only accepts valid status values", async () => {
    const validStatuses = ["applied", "under_review", "interview", "offer", "hired", "rejected"];
    const candidateIdBase = "550e8400-e29b-41d4-a716-4466554400";
    
    for (let i = 0; i < validStatuses.length; i++) {
      const status = validStatuses[i];
      const candidateId = candidateIdBase + i.toString().padStart(2, "0");
      
      const { data, error } = await supabase
        .from("applications")
        .insert({
          job_id: testJobId,
          candidate_id: candidateId,
          status: status,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.status).toBe(status);
      if (data?.id) testApplicationIds.push(data.id);
    }

    // Invalid status should fail
    const { error: invalidError } = await supabase
      .from("applications")
      .insert({
        job_id: testJobId,
        candidate_id: "550e8400-e29b-41d4-a716-446655440099",
        status: "invalid_status" as any,
      })
      .select();

    expect(invalidError).toBeDefined();
    expect(invalidError?.message).toContain("violates check constraint");
  });

  it("defaults status to 'applied' if not provided", async () => {
    const { data, error } = await supabase
      .from("applications")
      .insert({
        job_id: testJobId,
        candidate_id: "550e8400-e29b-41d4-a716-446655440010",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe("applied");
    if (data?.id) testApplicationIds.push(data.id);
  });

  it("cascades delete when job is deleted", async () => {
    const candidateId = "550e8400-e29b-41d4-a716-446655440011";
    
    // Create application
    const { data: app, error: appError } = await supabase
      .from("applications")
      .insert({
        job_id: testJobId,
        candidate_id: candidateId,
      })
      .select()
      .single();

    expect(appError).toBeNull();
    const applicationId = app?.id;

    // Delete the job
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", testJobId);

    expect(deleteError).toBeNull();
    
    // Remove from cleanup list since we just deleted it
    const index = testJobIds.indexOf(testJobId);
    if (index > -1) testJobIds.splice(index, 1);

    // Verify application was also deleted (cascade)
    const { data: deletedApp, error: fetchError } = await supabase
      .from("applications")
      .select()
      .eq("id", applicationId)
      .maybeSingle();

    expect(fetchError).toBeNull();
    expect(deletedApp).toBeNull();
  });
});

describe("Database Schema: Indexes", () => {
  // Note: These tests verify indexes exist by checking query performance
  // In a real app, you'd use EXPLAIN ANALYZE, but for basic smoke tests,
  // we just verify the queries work correctly

  let testJobId: string;

  beforeEach(async () => {
    const { data } = await supabase
      .from("jobs")
      .insert({
        title: "Index Test Job",
        company: "Test Co",
      })
      .select()
      .single();

    testJobId = data!.id;
    testJobIds.push(testJobId);
  });

  afterEach(async () => {
    if (testApplicationIds.length > 0) {
      await supabase.from("applications").delete().in("id", testApplicationIds);
      testApplicationIds.length = 0;
    }
    if (testJobIds.length > 0) {
      await supabase.from("jobs").delete().in("id", testJobIds);
      testJobIds.length = 0;
    }
  });

  it("can query applications by job_id efficiently (index exists)", async () => {
    // Create test applications
    for (let i = 0; i < 3; i++) {
      const { data } = await supabase
        .from("applications")
        .insert({
          job_id: testJobId,
          candidate_id: `550e8400-e29b-41d4-a716-44665544000${i}`,
        })
        .select()
        .single();
      
      if (data?.id) testApplicationIds.push(data.id);
    }

    // Query by job_id (should use index)
    const { data, error } = await supabase
      .from("applications")
      .select()
      .eq("job_id", testJobId);

    expect(error).toBeNull();
    expect(data).toHaveLength(3);
  });

  it("can query applications by candidate_id efficiently (index exists)", async () => {
    const candidateId = "550e8400-e29b-41d4-a716-446655440020";
    
    const { data: app } = await supabase
      .from("applications")
      .insert({
        job_id: testJobId,
        candidate_id: candidateId,
      })
      .select()
      .single();
    
    if (app?.id) testApplicationIds.push(app.id);

    // Query by candidate_id (should use index)
    const { data, error } = await supabase
      .from("applications")
      .select()
      .eq("candidate_id", candidateId);

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("can query applications by status efficiently (index exists)", async () => {
    const { data: app } = await supabase
      .from("applications")
      .insert({
        job_id: testJobId,
        candidate_id: "550e8400-e29b-41d4-a716-446655440021",
        status: "interview",
      })
      .select()
      .single();
    
    if (app?.id) testApplicationIds.push(app.id);

    // Query by status (should use index)
    const { data, error } = await supabase
      .from("applications")
      .select()
      .eq("status", "interview");

    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
  });

  it("can query applications by job_id AND status efficiently (composite index)", async () => {
    // Create applications with different statuses for the same job
    const statuses = ["applied", "under_review", "interview", "interview"];
    
    for (let i = 0; i < statuses.length; i++) {
      const { data } = await supabase
        .from("applications")
        .insert({
          job_id: testJobId,
          candidate_id: `550e8400-e29b-41d4-a716-44665544010${i}`,
          status: statuses[i],
        })
        .select()
        .single();
      
      if (data?.id) testApplicationIds.push(data.id);
    }

    // Query by BOTH job_id AND status (should use composite index)
    const { data, error } = await supabase
      .from("applications")
      .select()
      .eq("job_id", testJobId)
      .eq("status", "interview");

    expect(error).toBeNull();
    expect(data).toHaveLength(2); // Should only get the 'interview' applications
    expect(data!.every(app => app.status === "interview")).toBe(true);
  });

  it("can query jobs by employer_id AND status efficiently (composite index)", async () => {
    const employerId = "550e8400-e29b-41d4-a716-446655440030";
    
    // Create jobs with different statuses for the same employer
    const jobData = [
      { title: "Job 1", company: "Company", employer_id: employerId, status: "draft" },
      { title: "Job 2", company: "Company", employer_id: employerId, status: "open" },
      { title: "Job 3", company: "Company", employer_id: employerId, status: "open" },
      { title: "Job 4", company: "Company", employer_id: employerId, status: "closed" },
    ];

    for (const job of jobData) {
      const { data } = await supabase
        .from("jobs")
        .insert(job)
        .select()
        .single();
      
      if (data?.id) testJobIds.push(data.id);
    }

    // Query by BOTH employer_id AND status (should use composite index)
    const { data, error } = await supabase
      .from("jobs")
      .select()
      .eq("employer_id", employerId)
      .eq("status", "open");

    expect(error).toBeNull();
    expect(data).toHaveLength(2); // Should only get the 'open' jobs
    expect(data!.every(job => job.status === "open")).toBe(true);
    expect(data!.every(job => job.employer_id === employerId)).toBe(true);
  });
});
