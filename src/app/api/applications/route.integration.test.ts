import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { createClient as createSbClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

// Integration tests: use a real Supabase project via env
// Skips gracefully if env vars are missing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Helper to create mock NextRequest with JSON body
function req(body: unknown): NextRequest {
  return { json: async () => body } as NextRequest;
}

// Mock server client to bypass Next.js cookies() requirement in test env
vi.mock("@/lib/supabase/server", () => {
  if (shouldSkip) return { createClient: vi.fn(async () => ({})) };
  const client = createSbClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  return {
    createClient: vi.fn(async () => client),
  };
});

describe.skipIf(shouldSkip)("Integration: /api/applications", () => {
  const sb = createSbClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  const candidateId = crypto.randomUUID();
  let jobId: string;
  let createdAppId: string | undefined;
  let POST: (req: NextRequest) => Promise<Response>;
  let GET: () => Promise<Response>;

  beforeAll(async () => {
    // Import route AFTER mocking createClient
    const mod = await import("./route");
    POST = mod.POST;
    GET = mod.GET;
    // Create a test job (status open)
    const { data, error } = await sb
      .from("jobs")
      .insert({ title: "Int Test Job", company: "Int Co", status: "open" })
      .select()
      .single();
    if (error) throw new Error(`Failed to create test job: ${error.message}`);
    jobId = data!.id;
  });

  afterAll(async () => {
    // Cleanup created application
    if (createdAppId) {
      await sb.from("applications").delete().eq("id", createdAppId);
    }
    // Cleanup job last to avoid FK constraints
    if (jobId) {
      await sb.from("jobs").delete().eq("id", jobId);
    }
  });

  it("POST creates an application (201)", async () => {
    const response = await POST(
      req({
        job_id: jobId,
        candidate_id: candidateId,
        resume_url: "https://example.com/resume.pdf",
      })
    );
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body?.application?.id).toBeTruthy();
    expect(body?.application?.job_id).toBe(jobId);
    expect(body?.application?.candidate_id).toBe(candidateId);
    createdAppId = body?.application?.id;
  });

  it("GET returns applications including the created one (200)", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    // Data may include many apps; verify ours exists
    const found = (data as any[]).some((a) => a.id === createdAppId || a.job_id === jobId);
    expect(found).toBe(true);
  });
});
