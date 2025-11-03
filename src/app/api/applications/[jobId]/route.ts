import { NextRequest, NextResponse } from "next/server";
import { updateApplicationStatus, type ApplicationStatus } from "@/lib/applications";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const body = await req.json();
    const status = body?.status as ApplicationStatus;
    
    if (!status || !["Applied", "Under Review", "Interview", "Offer", "Hired", "Rejected"].includes(status)) {
      return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
    }
    
    const result = await updateApplicationStatus(jobId, status);
    
    if (!result.success) {
      return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });
    }
    
    return NextResponse.json(result.application);
  } catch (e: any) {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
