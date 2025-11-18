import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

// Minimal NextRequest-like object for tests
function makeReqWithFormData(form: FormData | null): any {
  return {
    formData: async () => form as any,
  } as any;
}

// Helpers to build a File for tests
function makeFile(name: string, type: string, size: number): File {
  const bytes = new Uint8Array(Math.min(size, 1024));
  const blob = new Blob([bytes], { type });
  // Blob size is bytes.length, mimic size by padding metadata; the route reads size from File.size
  return new File([blob, new Uint8Array(Math.max(0, size - bytes.length))], name, { type });
}

declare global {
  // eslint-disable-next-line no-var
  var __testSession: any | undefined;
  // eslint-disable-next-line no-var
  var __uploadShouldFail: boolean | undefined;
  // eslint-disable-next-line no-var
  var __dbUpdateShouldFail: string | undefined;
  // eslint-disable-next-line no-var
  var __dbUpdateAffectsZero: boolean | undefined;
}

vi.mock("@/lib/supabase/server", () => {
  const getSession = vi.fn(async () => globalThis.__testSession ?? { data: { session: null } });

  const storageFrom = {
    upload: vi.fn(async () => ({ error: globalThis.__uploadShouldFail ? { message: "upload failed" } : null })),
    getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://example.com/object/public/resumes/${path}` } })),
  };

  // Chain for DB update with .eq().select()
  const updateChain = {
    eq: vi.fn(() => ({
      select: vi.fn(async () => ({
        error: globalThis.__dbUpdateShouldFail ? { message: globalThis.__dbUpdateShouldFail } : null,
        data: globalThis.__dbUpdateAffectsZero ? [] : [{}],
      })),
    })),
  };
  const fromChain = {
    update: vi.fn(() => updateChain),
  };

  const createClient = vi.fn(async () => ({
    auth: { getSession },
    storage: { from: vi.fn(() => storageFrom) },
    from: vi.fn(() => fromChain),
  }));

  return { createClient };
});

describe("POST /api/resume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.__testSession = { data: { session: { user: { id: "user-1" } } } };
    globalThis.__uploadShouldFail = false;
    globalThis.__dbUpdateShouldFail = undefined;
    globalThis.__dbUpdateAffectsZero = false;
  });

  it("returns 401 when unauthorized", async () => {
    globalThis.__testSession = { data: { session: null } };
    const res = await POST(makeReqWithFormData(new FormData()));
    expect(res.status).toBe(401);
    const body = await (res as Response).json();
    expect(body).toEqual({ error: "UNAUTHORIZED" });
  });

  it("returns 400 when file missing", async () => {
    const res = await POST(makeReqWithFormData(new FormData()));
    expect(res.status).toBe(400);
    const body = await (res as Response).json();
    expect(body.error).toBe("MISSING_FILE");
  });

  it("returns 400 for invalid file type", async () => {
    const fd = new FormData();
    fd.append("file", makeFile("test.png", "image/png", 1000));
    const res = await POST(makeReqWithFormData(fd));
    expect(res.status).toBe(400);
    const body = await (res as Response).json();
    expect(body.error).toBe("INVALID_FILE_TYPE");
  });

  it("returns 400 for file too large (>5MB)", async () => {
    const fd = new FormData();
    fd.append("file", makeFile("big.pdf", "application/pdf", 5 * 1024 * 1024 + 1));
    const res = await POST(makeReqWithFormData(fd));
    expect(res.status).toBe(400);
    const body = await (res as Response).json();
    expect(body.error).toBe("FILE_TOO_LARGE");
  });

  it("returns 500 when storage upload fails", async () => {
    globalThis.__uploadShouldFail = true;
    const fd = new FormData();
    fd.append("file", makeFile("ok.pdf", "application/pdf", 1024));
    const res = await POST(makeReqWithFormData(fd));
    expect(res.status).toBe(500);
    const body = await (res as Response).json();
    expect(body.error).toBe("UPLOAD_FAILED");
  });

  it("returns 400 when DB update fails and includes error message", async () => {
    globalThis.__dbUpdateShouldFail = "DB_ERR";
    const fd = new FormData();
    fd.append("file", makeFile("ok.pdf", "application/pdf", 1024));
    const res = await POST(makeReqWithFormData(fd));
    expect(res.status).toBe(400);
    const body = await (res as Response).json();
    expect(body.error).toBe("DB_ERR");
  });

  it("succeeds for valid PDF and returns profile-shaped payload", async () => {
    const fd = new FormData();
    fd.append("file", makeFile("ok.pdf", "application/pdf", 2048));
    const res = await POST(makeReqWithFormData(fd));
    expect(res.status).toBe(200);
    const body = await (res as Response).json();
    expect(body.resume).toBeTruthy();
    expect(body.resume.url).toMatch(/object\/public\/resumes\//);
  });

  it("fails when DB update affects zero rows (profile not found)", async () => {
    globalThis.__dbUpdateAffectsZero = true;
    const fd = new FormData();
    fd.append("file", makeFile("zero.pdf", "application/pdf", 1500));
    const res = await POST(makeReqWithFormData(fd));
    // Expected behavior: API should not report success when nothing was updated
    // Choose a failure code to surface the issue (adjust when implementing):
    expect(res.status).not.toBe(200);
    const body = await (res as Response).json();
    // Ideally: { error: "PROFILE_NOT_FOUND" }
    expect(typeof body.error).toBe("string");
  });
});
