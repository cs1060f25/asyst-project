import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

declare global {
  // eslint-disable-next-line no-var
  var __testSession: any | undefined;
  // eslint-disable-next-line no-var
  var __testCandidateRow: any | undefined;
}

vi.mock("@/lib/supabase/server", () => {
  const getSession = vi.fn(async () => globalThis.__testSession ?? { data: { session: null } });
  const fromChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: globalThis.__testCandidateRow ?? null })),
  };
  const createClient = vi.fn(async () => ({
    auth: { getSession },
    from: vi.fn(() => fromChain),
  }));
  return { createClient };
});

describe("GET /api/profile name derivation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers first + last name from user metadata over username when no stored name", async () => {
    globalThis.__testSession = {
      data: {
        session: {
          user: {
            id: "user-1",
            user_metadata: {
              username: "janed",
              user_name: "janed",
              first_name: "Jane",
              last_name: "Doe",
              full_name: "Jane Doe",
            },
          },
        },
      },
    };
    globalThis.__testCandidateRow = null;

    const res = await GET();
    const body = await (res as Response).json();

    // Desired behavior: API should construct display name from first + last
    expect(body.name).toBe("Jane Doe");
  });

  it("prefers first + last name from user metadata over stored username value", async () => {
    globalThis.__testSession = {
      data: {
        session: {
          user: {
            id: "user-2",
            user_metadata: {
              username: "johnny",
              user_name: "johnny",
              first_name: "John",
              last_name: "Smith",
              full_name: "John Smith",
            },
          },
        },
      },
    };
    globalThis.__testCandidateRow = {
      name: "johnny",
      email: "john@example.com",
      education: "",
      resume_url: null,
      offer_deadline: null,
    };

    const res = await GET();
    const body = await (res as Response).json();

    // Desired behavior: even if DB has username, prefer real first + last
    expect(body.name).toBe("John Smith");
  });
});
