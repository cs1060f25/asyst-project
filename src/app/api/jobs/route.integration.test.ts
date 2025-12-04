import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createClient as createSbClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Mock server client to bypass Next.js cookies() in test env
vi.mock("@/lib/supabase/server", () => {
  if (shouldSkip) return { createClient: vi.fn(async () => ({})) };
  const client = createSbClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  return { createClient: vi.fn(async () => client) };
});

describe.skipIf(shouldSkip)("Integration: /api/jobs", () => {
  const sb = createSbClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
  let openJobId: string | undefined;
  let closedJobId: string | undefined;
  let GET: () => Promise<Response>;

  beforeAll(async () => {
    const mod = await import("./route");
    GET = mod.GET;
    const { data: openJob } = await sb
      .from("jobs")
      .insert({ title: "Open Job", company: "Int Co", status: "open" })
      .select()
      .single();
    openJobId = openJob?.id;

    const { data: closedJob } = await sb
      .from("jobs")
      .insert({ title: "Closed Job", company: "Int Co", status: "closed" })
      .select()
      .single();
    closedJobId = closedJob?.id;
  });

  afterAll(async () => {
    if (openJobId) await sb.from("jobs").delete().eq("id", openJobId);
    if (closedJobId) await sb.from("jobs").delete().eq("id", closedJobId);
  });

  it("GET returns only open jobs (200)", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    const ids = (data as any[]).map((j) => j.id);
    expect(ids).toContain(openJobId);
    expect(ids).not.toContain(closedJobId);
  });
});
