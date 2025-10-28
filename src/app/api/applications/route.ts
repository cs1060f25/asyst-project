import { NextRequest, NextResponse } from "next/server";
import { applyToJob, readApplications, type ApplicationDetails } from "@/lib/applications";

export const runtime = "nodejs";

// GET /api/applications — return stored applications (local JSON storage)
export async function GET() {
  const apps = await readApplications();
  return NextResponse.json(apps);
}

// POST /api/applications — apply to a job with optional supplemental details
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobId = String(body?.jobId || "").trim();
    let details: ApplicationDetails | undefined;
    if (body?.details && typeof body.details === "object") {
      const coverLetter = typeof body.details.coverLetter === "string" ? body.details.coverLetter : undefined;
      const answers = body.details.answers && typeof body.details.answers === "object" ? (body.details.answers as Record<string, string>) : undefined;
      details = { coverLetter, answers };
    }
    if (!jobId) {
      return NextResponse.json({ error: "MISSING_JOB_ID" }, { status: 400 });
    }
    const result = await applyToJob(jobId, details);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
