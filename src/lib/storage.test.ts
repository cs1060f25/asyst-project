import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import {
  ALLOWED_MIME_TYPES,
  isAllowedResumeType,
  MAX_RESUME_BYTES,
  sanitizeFilename,
  getPublicUrlForSavedFile,
} from "./storage";

describe("storage validation", () => {
  it("allows only specific MIME types", () => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    for (const m of allowed) {
      expect(isAllowedResumeType(m)).toBe(true);
      expect(ALLOWED_MIME_TYPES.has(m)).toBe(true);
    }
    const disallowed = ["text/plain", "image/png", "application/zip"];
    for (const m of disallowed) {
      expect(isAllowedResumeType(m)).toBe(false);
    }
  });

  it("exposes a reasonable max size (5MB)", () => {
    expect(MAX_RESUME_BYTES).toBe(5 * 1024 * 1024);
  });

  it("sanitizes filenames by replacing unsafe chars", () => {
    expect(sanitizeFilename("my file(1).pdf")).toBe("my_file_1_.pdf");
    expect(sanitizeFilename("résumé.docx")).toBe("r_sum_.docx");
    expect(sanitizeFilename("clean-name_1.2-3.doc")).toBe("clean-name_1.2-3.doc");
  });
});

describe("getPublicUrlForSavedFile", () => {
  const cwd = process.cwd();
  const publicDir = path.join(cwd, "public");
  const uploadsDir = path.join(publicDir, "uploads");
  const testFile = path.join(uploadsDir, "tmp-test.txt");

  beforeAll(async () => {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(testFile, "ok", "utf-8");
  });

  afterAll(async () => {
    try { await fs.unlink(testFile); } catch {}
  });

  it("returns URL path relative to public/ root", () => {
    const url = getPublicUrlForSavedFile(testFile);
    expect(url).toBe("/uploads/tmp-test.txt");
  });
});
