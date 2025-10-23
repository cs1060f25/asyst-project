import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import {
  readProfile,
  writeProfile,
  type Profile,
} from "./storage";

const tmpDir = path.join(process.cwd(), ".tmp-test");
const tmpProfileFile = path.join(tmpDir, "profile.json");

async function resetTmp() {
  await fs.mkdir(tmpDir, { recursive: true });
  try { await fs.unlink(tmpProfileFile); } catch {}
}

describe("profile with offer deadline", () => {
  beforeEach(async () => {
    process.env.PROFILE_JSON = tmpProfileFile;
    await resetTmp();
  });

  afterEach(async () => {
    try { await fs.unlink(tmpProfileFile); } catch {}
  });

  it("creates default profile with null offer deadline", async () => {
    const profile = await readProfile();
    expect(profile.name).toBe("");
    expect(profile.email).toBe("");
    expect(profile.education).toBe("");
    expect(profile.resume).toBeNull();
    expect(profile.offerDeadline).toBeNull();
  });

  it("saves and reads profile with offer deadline", async () => {
    const testProfile: Profile = {
      name: "John Doe",
      email: "john@example.com",
      education: "BS Computer Science",
      resume: null,
      offerDeadline: "2024-12-31T23:59:59.000Z",
    };

    await writeProfile(testProfile);
    const savedProfile = await readProfile();

    expect(savedProfile.name).toBe("John Doe");
    expect(savedProfile.email).toBe("john@example.com");
    expect(savedProfile.education).toBe("BS Computer Science");
    expect(savedProfile.offerDeadline).toBe("2024-12-31T23:59:59.000Z");
  });

  it("handles backward compatibility for profiles without offer deadline", async () => {
    // Simulate old profile format without offerDeadline
    const oldProfile = {
      name: "Jane Smith",
      email: "jane@example.com",
      education: "MS Data Science",
      resume: null,
    };

    await fs.writeFile(tmpProfileFile, JSON.stringify(oldProfile, null, 2), "utf-8");
    
    const profile = await readProfile();
    expect(profile.name).toBe("Jane Smith");
    expect(profile.email).toBe("jane@example.com");
    expect(profile.education).toBe("MS Data Science");
    expect(profile.offerDeadline).toBeNull(); // Should default to null
  });

  it("preserves offer deadline when updating other fields", async () => {
    const initialProfile: Profile = {
      name: "Alice Johnson",
      email: "alice@example.com",
      education: "PhD Physics",
      resume: null,
      offerDeadline: "2024-11-15T12:00:00.000Z",
    };

    await writeProfile(initialProfile);

    // Update only the name
    const updatedProfile = await readProfile();
    updatedProfile.name = "Alice J. Johnson";
    await writeProfile(updatedProfile);

    const finalProfile = await readProfile();
    expect(finalProfile.name).toBe("Alice J. Johnson");
    expect(finalProfile.offerDeadline).toBe("2024-11-15T12:00:00.000Z"); // Should be preserved
  });

  it("allows clearing offer deadline", async () => {
    const profileWithDeadline: Profile = {
      name: "Bob Wilson",
      email: "bob@example.com",
      education: "BA Economics",
      resume: null,
      offerDeadline: "2024-10-30T18:00:00.000Z",
    };

    await writeProfile(profileWithDeadline);

    // Clear the deadline
    const updatedProfile = await readProfile();
    updatedProfile.offerDeadline = null;
    await writeProfile(updatedProfile);

    const finalProfile = await readProfile();
    expect(finalProfile.name).toBe("Bob Wilson");
    expect(finalProfile.offerDeadline).toBeNull();
  });

  it("handles future dates correctly", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now
    
    const profileWithFutureDeadline: Profile = {
      name: "Future Candidate",
      email: "future@example.com",
      education: "MS Engineering",
      resume: null,
      offerDeadline: futureDate.toISOString(),
    };

    await writeProfile(profileWithFutureDeadline);
    const savedProfile = await readProfile();
    
    expect(savedProfile.offerDeadline).toBe(futureDate.toISOString());
  });
});
