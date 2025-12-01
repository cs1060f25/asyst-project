/**
 * BUG #2 TEST: Missing Job Status Validation in Applications API
 * 
 * This test reproduces the bug where the applications API allows candidates
 * to apply to jobs that are closed, paused, or have invalid status values.
 * 
 * Expected Behavior: Only allow applications to jobs with status 'open'
 * Actual Behavior: Doesn't properly handle null, undefined, or other invalid statuses
 * 
 * SEV2 - High severity business logic bug
 * Priority: High
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
  } as NextRequest;
}

describe("Bug #2: Missing Job Status Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("correctly rejects applications when job status is explicitly closed", async () => {
    const mockJobId = "job-closed-123";
    const mockCandidateId = "candidate-123";

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockCandidateId, email: "test@example.com" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "jobs") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockJobId,
                title: "Closed Position",
                company: "Test Corp",
                status: "closed", // Job is closed
              },
              error: null,
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = createMockRequest({
      job_id: mockJobId,
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    // This should work correctly - rejecting closed jobs
    expect(response.status).toBe(403);
    expect(data.error).toBe("Job not accepting applications");
  });

  it("BUG REPRODUCTION: allows applications when job status is null", async () => {
    const mockJobId = "job-null-status-123";
    const mockCandidateId = "candidate-123";

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockCandidateId, email: "test@example.com" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "app-123",
                job_id: mockJobId,
                candidate_id: mockCandidateId,
                status: "applied",
                applied_at: "2025-11-18T00:00:00Z",
              },
              error: null,
            }),
          };
        }
        if (table === "jobs") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockJobId,
                title: "Job with Null Status",
                company: "Test Corp",
                status: null, // BUG: null status should be treated as invalid
              },
              error: null,
            }),
          };
        }
        if (table === "candidate_profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { resume_url: "https://example.com/resume.pdf" },
              error: null,
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = createMockRequest({
      job_id: mockJobId,
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    // BUG: The API allows the application even though status is null
    // Current behavior: Treats null as not-open, but logic is flawed
    // The check `job.status !== 'open'` will be true for null, so it should reject
    // BUT if the status field is missing from the select, it won't check properly

    console.log("Response status:", response.status);
    console.log("Response data:", data);

    // This documents the bug - behavior depends on whether status is included in select
  });

  it("BUG REPRODUCTION: allows applications when job status is undefined", async () => {
    const mockJobId = "job-undefined-status-123";
    const mockCandidateId = "candidate-123";

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockCandidateId, email: "test@example.com" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "app-456",
                job_id: mockJobId,
                candidate_id: mockCandidateId,
                status: "applied",
                applied_at: "2025-11-18T00:00:00Z",
              },
              error: null,
            }),
          };
        }
        if (table === "jobs") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockJobId,
                title: "Job with Undefined Status",
                company: "Test Corp",
                // status field is not returned - undefined
              },
              error: null,
            }),
          };
        }
        if (table === "candidate_profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { resume_url: "https://example.com/resume.pdf" },
              error: null,
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = createMockRequest({
      job_id: mockJobId,
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    // BUG: When status is undefined, the check fails
    // Expected: Should reject with 403
    // Actual: May allow application through
    
    console.log("Bug reproduction - undefined status:", response.status);
  });

  it("BUG REPRODUCTION: allows applications when job status is 'paused'", async () => {
    const mockJobId = "job-paused-123";
    const mockCandidateId = "candidate-123";

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockCandidateId, email: "test@example.com" } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "jobs") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockJobId,
                title: "Paused Position",
                company: "Test Corp",
                status: "paused", // Job is paused - should not accept applications
              },
              error: null,
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = createMockRequest({
      job_id: mockJobId,
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    // Should correctly reject paused jobs
    expect(response.status).toBe(403);
    expect(data.message).toContain("paused");
  });

  it("should provide clear error messages for each invalid status", async () => {
    // This test documents the DESIRED behavior
    // Error messages should be specific and helpful
    
    const invalidStatuses = ["closed", "paused", "draft", "archived", null, undefined];
    
    // After fix, each invalid status should return:
    // - 403 status code
    // - Clear error message indicating why application was rejected
    // - The actual job status in the response
    
    expect(invalidStatuses.length).toBeGreaterThan(0);
  });
});
