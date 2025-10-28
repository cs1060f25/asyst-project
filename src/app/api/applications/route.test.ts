// =============================================
// API ENDPOINT TESTS
// Tests for POST /api/applications endpoint
// =============================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST, GET } from "./route";
import { NextRequest } from "next/server";

// Mock the Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

// Helper to create a mock NextRequest
function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
  } as NextRequest;
}

// Mock Supabase client methods
function createMockSupabaseClient(overrides: any = {}) {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(overrides.single || { data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue(overrides.maybeSingle || { data: null, error: null }),
      ...overrides[table],
    })),
  };
}

describe("POST /api/applications - Success Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 201 and creates application with valid data", async () => {
    const mockJobId = "f4b5c6bb-d5c1-44c1-81fa-927378202352";
    const mockCandidateId = "550e8400-e29b-41d4-a716-446655440001";
    const mockApplicationId = "1c43cdc0-ec21-4d25-8723-6ccf0246eda3";

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // No duplicate
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockApplicationId,
                job_id: mockJobId,
                candidate_id: mockCandidateId,
                status: "applied",
                resume_url: "https://example.com/resume.pdf",
                cover_letter: "I'm interested in this role",
                supplemental_answers: null,
                applied_at: "2025-10-28T00:00:00Z",
                updated_at: "2025-10-28T00:00:00Z",
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
                title: "Frontend Engineer",
                company: "Acme Corp",
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
      candidate_id: mockCandidateId,
      resume_url: "https://example.com/resume.pdf",
      cover_letter: "I'm interested in this role",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("Application created successfully");
    expect(data.application).toBeDefined();
    expect(data.application.id).toBe(mockApplicationId);
    expect(data.application.job_id).toBe(mockJobId);
    expect(data.application.candidate_id).toBe(mockCandidateId);
    expect(data.application.applied_at).toBeDefined();
    expect(data.job).toBeDefined();
    expect(data.job.title).toBe("Frontend Engineer");
  });

  it("accepts optional fields (cover_letter, supplemental_answers)", async () => {
    const mockJobId = "f4b5c6bb-d5c1-44c1-81fa-927378202352";
    const mockCandidateId = "550e8400-e29b-41d4-a716-446655440002";

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "app-123",
                job_id: mockJobId,
                candidate_id: mockCandidateId,
                status: "applied",
                resume_url: "https://example.com/resume.pdf",
                cover_letter: "My cover letter",
                supplemental_answers: { q1: "answer1", q2: "answer2" },
                applied_at: "2025-10-28T00:00:00Z",
                updated_at: "2025-10-28T00:00:00Z",
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
              data: { id: mockJobId, title: "Test Job", company: "Test Co" },
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
      candidate_id: mockCandidateId,
      resume_url: "https://example.com/resume.pdf",
      cover_letter: "My cover letter",
      supplemental_answers: { q1: "answer1", q2: "answer2" },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.application.cover_letter).toBe("My cover letter");
    expect(data.application.supplemental_answers).toEqual({ q1: "answer1", q2: "answer2" });
  });
});

describe("POST /api/applications - Validation Errors (400)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when job_id is missing", async () => {
    const request = createMockRequest({
      candidate_id: "550e8400-e29b-41d4-a716-446655440001",
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details.job_id).toBeDefined();
  });

  it("returns 400 when candidate_id is missing", async () => {
    const request = createMockRequest({
      job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details.candidate_id).toBeDefined();
  });

  it("returns 400 when resume_url is missing", async () => {
    const request = createMockRequest({
      job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
      candidate_id: "550e8400-e29b-41d4-a716-446655440001",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details.resume_url).toBeDefined();
  });

  it("returns 400 when job_id is not a valid UUID", async () => {
    const request = createMockRequest({
      job_id: "not-a-uuid",
      candidate_id: "550e8400-e29b-41d4-a716-446655440001",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details.job_id).toBeDefined();
    expect(data.details.job_id[0]).toContain("valid UUID");
  });

  it("returns 400 when candidate_id is not a valid UUID", async () => {
    const request = createMockRequest({
      job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
      candidate_id: "not-a-uuid",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details.candidate_id).toBeDefined();
    expect(data.details.candidate_id[0]).toContain("valid UUID");
  });

  it("returns 400 when resume_url is not a valid URL", async () => {
    const request = createMockRequest({
      job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
      candidate_id: "550e8400-e29b-41d4-a716-446655440001",
      resume_url: "not-a-url",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details.resume_url).toBeDefined();
    expect(data.details.resume_url[0]).toContain("valid URL");
  });

  it("returns 400 when resume_url is an empty string", async () => {
    const request = createMockRequest({
      job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
      candidate_id: "550e8400-e29b-41d4-a716-446655440001",
      resume_url: "",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details.resume_url).toBeDefined();
    expect(data.details.resume_url[0]).toContain("cannot be empty");
  });

  it("returns 400 when resume_url uses dangerous protocol (javascript:, file:)", async () => {
    const dangerousUrls = [
      "javascript:alert('xss')",
      "file:///etc/passwd",
      "data:text/html,<script>alert('xss')</script>",
    ];

    for (const url of dangerousUrls) {
      const request = createMockRequest({
        job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
        candidate_id: "550e8400-e29b-41d4-a716-446655440001",
        resume_url: url,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details.resume_url).toBeDefined();
    }
  });

  it("returns 400 when resume_url has invalid file extension", async () => {
    const request = createMockRequest({
      job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
      candidate_id: "550e8400-e29b-41d4-a716-446655440001",
      resume_url: "https://example.com/file.exe",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details.resume_url).toBeDefined();
    expect(data.details.resume_url[0]).toContain("valid document");
  });

  it("accepts valid HTTP URLs with proper extensions", async () => {
    const validUrls = [
      "https://example.com/resume.pdf",
      "http://example.com/docs/resume.docx",
      "https://cdn.example.com/resumes/john-doe.doc",
    ];

    for (const url of validUrls) {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "applications") {
            return {
              select: vi.fn().mockReturnThis(),
              insert: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              single: vi.fn().mockResolvedValue({
                data: { id: "test-id", resume_url: url },
                error: null,
              }),
            };
          }
          if (table === "jobs") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "job-1", title: "Test", company: "Test" },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({
        job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
        candidate_id: "550e8400-e29b-41d4-a716-446655440001",
        resume_url: url,
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    }
  });

  it("accepts cloud storage URLs without extensions", async () => {
    const cloudUrls = [
      "https://abc123.supabase.co/storage/v1/object/public/resumes/uuid-file",
      "https://bucket.s3.amazonaws.com/resumes/file-id",
      "https://storage.googleapis.com/bucket/resumes/file",
    ];

    for (const url of cloudUrls) {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "applications") {
            return {
              select: vi.fn().mockReturnThis(),
              insert: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              single: vi.fn().mockResolvedValue({
                data: { id: "test-id", resume_url: url },
                error: null,
              }),
            };
          }
          if (table === "jobs") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "job-1", title: "Test", company: "Test" },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({
        job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
        candidate_id: "550e8400-e29b-41d4-a716-446655440001",
        resume_url: url,
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    }
  });

  it("returns 400 when cover_letter exceeds 5000 characters", async () => {
    const longText = "a".repeat(5001);
    
    const request = createMockRequest({
      job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
      candidate_id: "550e8400-e29b-41d4-a716-446655440001",
      cover_letter: longText,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(data.details.cover_letter).toBeDefined();
  });

  it("returns 400 for invalid JSON body", async () => {
    const request = {
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid JSON in request body");
  });
});

describe("POST /api/applications - Duplicate Detection (409)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 409 when candidate has already applied to the job", async () => {
    const mockJobId = "f4b5c6bb-d5c1-44c1-81fa-927378202352";
    const mockCandidateId = "550e8400-e29b-41d4-a716-446655440001";

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "existing-app-id",
                status: "applied",
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
      candidate_id: mockCandidateId,
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Duplicate application");
    expect(data.message).toContain("already applied");
    expect(data.existing).toBeDefined();
    expect(data.existing.id).toBe("existing-app-id");
  });
});

describe("POST /api/applications - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when job does not exist", async () => {
    const mockJobId = "f4b5c6bb-d5c1-44c1-81fa-927378202352";
    const mockCandidateId = "550e8400-e29b-41d4-a716-446655440001";

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // No duplicate
          };
        }
        if (table === "jobs") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "No rows returned" },
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = createMockRequest({
      job_id: mockJobId,
      candidate_id: mockCandidateId,
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Job not found");
    expect(data.message).toContain("does not exist");
  });

  it("returns 500 when database insert fails", async () => {
    const mockJobId = "f4b5c6bb-d5c1-44c1-81fa-927378202352";
    const mockCandidateId = "550e8400-e29b-41d4-a716-446655440001";

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "applications") {
          return {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database connection failed" },
            }),
          };
        }
        if (table === "jobs") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockJobId, title: "Test", company: "Test" },
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
      candidate_id: mockCandidateId,
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create application");
  });

  it("returns 500 when checking for duplicates fails", async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      })),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const request = createMockRequest({
      job_id: "f4b5c6bb-d5c1-44c1-81fa-927378202352",
      candidate_id: "550e8400-e29b-41d4-a716-446655440001",
      resume_url: "https://example.com/resume.pdf",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to check existing applications");
  });
});

describe("GET /api/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with all applications", async () => {
    const mockApplications = [
      {
        id: "app-1",
        job_id: "job-1",
        candidate_id: "candidate-1",
        status: "applied",
        applied_at: "2025-10-28T00:00:00Z",
      },
      {
        id: "app-2",
        job_id: "job-2",
        candidate_id: "candidate-2",
        status: "interview",
        applied_at: "2025-10-27T00:00:00Z",
      },
    ];

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockApplications,
          error: null,
        }),
      })),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe("app-1");
  });

  it("returns empty array when no applications exist", async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it("returns 500 when database query fails", async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      })),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch applications");
  });
});
