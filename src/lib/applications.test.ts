import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import {
  applyToJob,
  readApplications,
  writeApplications,
  getApplicationStatus,
  updateApplicationStatus,
  getApplicationsWithCandidateInfo,
  type Application,
  type ApplicationStatus,
} from "./applications";

const tmpDir = path.join(process.cwd(), ".tmp-test");
const tmpFile = path.join(tmpDir, "applications.json");

async function resetTmp() {
  await fs.mkdir(tmpDir, { recursive: true });
  try { await fs.unlink(tmpFile); } catch {}
}

describe("applications logic", () => {
  beforeEach(async () => {
    process.env.APPLICATIONS_JSON = tmpFile;
    await resetTmp();
    await writeApplications([]);
  });

  it("rejects applying with an empty or whitespace-only jobId (should not create entry)", async () => {
    await expect(applyToJob("")).rejects.toBeTruthy();
    await expect(applyToJob("   ")).rejects.toBeTruthy();

    const apps = await readApplications();
    expect(apps.find((a) => a.jobId.trim() === "")).toBeUndefined();
  });

  it("prevents duplicate applications even if jobId has surrounding whitespace", async () => {
    const first = await applyToJob("job-5");
    expect(first.created).toBe(true);

    const dup = await applyToJob("  job-5   ");
    // Expected behavior: treat as duplicate
    expect(dup.created).toBe(false);

    const apps = await readApplications();
    // Should only have one record for job-5 after trimming
    const count = apps.filter((a) => a.jobId.replace(/\s+/g, "") === "job-5").length;
    expect(count).toBe(1);
  });
  afterEach(async () => {
    try { await fs.unlink(tmpFile); } catch {}
  });

  it("applies to a job once", async () => {
    const r1 = await applyToJob("job-1");
    expect(r1.created).toBe(true);
    expect(r1.status).toBe("Applied");

    const apps = await readApplications();
    expect(apps.length).toBe(1);
    expect(apps[0].jobId).toBe("job-1");
    expect(apps[0].status).toBe("Applied");
  });

  it("prevents duplicate applications", async () => {
    await applyToJob("job-2");
    const r2 = await applyToJob("job-2");
    expect(r2.created).toBe(false);
    expect(r2.status).toBe("Applied");

    const apps = await readApplications();
    expect(apps.filter((a) => a.jobId === "job-2").length).toBe(1);
  });

  it("returns correct status for a job", async () => {
    // Seed with two apps
    const seeded: Application[] = [
      { jobId: "job-3", status: "Applied", appliedAt: new Date().toISOString() },
      { jobId: "job-4", status: "Under Review", appliedAt: new Date().toISOString() },
    ];
    await writeApplications(seeded);
    const apps = await readApplications();

    expect(getApplicationStatus(apps, "job-3")).toBe("Applied");
    expect(getApplicationStatus(apps, "job-4")).toBe("Under Review");
    expect(getApplicationStatus(apps, "job-unknown")).toBeNull();
  });

  it("updates application status successfully", async () => {
    // Create an application first
    await applyToJob("job-5");
    
    // Update its status
    const result = await updateApplicationStatus("job-5", "Under Review");
    expect(result.success).toBe(true);
    expect(result.application?.status).toBe("Under Review");
    
    // Verify the update persisted
    const apps = await readApplications();
    const app = apps.find(a => a.jobId === "job-5");
    expect(app?.status).toBe("Under Review");
  });

  it("fails to update non-existent application", async () => {
    const result = await updateApplicationStatus("non-existent", "Interview");
    expect(result.success).toBe(false);
    expect(result.application).toBeUndefined();
  });

  it("rejects invalid job ID for status update", async () => {
    await expect(updateApplicationStatus("", "Interview")).rejects.toBeTruthy();
    await expect(updateApplicationStatus("   ", "Interview")).rejects.toBeTruthy();
  });

  it("supports all application status types", async () => {
    const statuses: ApplicationStatus[] = ["Applied", "Under Review", "Interview", "Offer", "Hired", "Rejected"];
    
    await applyToJob("job-6");
    
    for (const status of statuses) {
      const result = await updateApplicationStatus("job-6", status);
      expect(result.success).toBe(true);
      expect(result.application?.status).toBe(status);
    }
  });

  it("gets applications with candidate info when profile exists", async () => {
    // Create some test applications
    await applyToJob("job-7");
    await applyToJob("job-8");
    
    // This test assumes the profile system is working
    // In a real test, we'd mock the profile reading
    const appsWithCandidate = await getApplicationsWithCandidateInfo();
    
    expect(appsWithCandidate.length).toBe(2);
    // Each application should have the same structure as before
    expect(appsWithCandidate[0]).toHaveProperty("jobId");
    expect(appsWithCandidate[0]).toHaveProperty("status");
    expect(appsWithCandidate[0]).toHaveProperty("appliedAt");
    // And may have candidate info (depending on profile availability)
    expect(appsWithCandidate[0]).toHaveProperty("candidateInfo");
  });
});
