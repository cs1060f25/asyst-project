import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import {
  applyToJob,
  readApplications,
  writeApplications,
  getApplicationStatus,
  type Application,
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
});
