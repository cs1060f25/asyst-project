import { NextRequest, NextResponse } from "next/server";
import { applyToJob, readApplications } from "@/lib/applications";

export const runtime = "nodejs";

export async function GET() {
  const apps = await readApplications();
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobId = String(body?.jobId || "").trim();
    if (!jobId) {
      return NextResponse.json({ error: "MISSING_JOB_ID" }, { status: 400 });
    }
    const result = await applyToJob(jobId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
