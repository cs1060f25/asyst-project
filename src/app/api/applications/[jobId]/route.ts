import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ApplicationStatus = "Applied" | "Under Review" | "Interview" | "Offer" | "Hired" | "Rejected";

export const runtime = "nodejs";

export async function PATCH(req: Request, context: unknown) {
  try {
    const { jobId } = (context as { params: { jobId: string } }).params;
    const body = await req.json();
    const status = body?.status as ApplicationStatus;
    
    if (!status || !["Applied", "Under Review", "Interview", "Offer", "Hired", "Rejected"].includes(status)) {
      return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
    }

    // Map frontend status to DB enum format
    const map: Record<ApplicationStatus, string> = {
      "Applied": "applied",
      "Under Review": "under_review",
      "Interview": "interview",
      "Offer": "offer",
      "Hired": "hired",
      "Rejected": "rejected",
    };

    const dbStatus = map[status];

    const supabase = await createClient();

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    // Update the application that matches this user and job
    const { data: updated, error: updateError } = await supabase
      .from("applications")
      .update({ status: dbStatus })
      .eq("job_id", jobId)
      .eq("candidate_id", authData.user.id)
      .select()
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });
    }

    // Return in frontend format
    const reverseMap: Record<string, ApplicationStatus> = {
      "applied": "Applied",
      "under_review": "Under Review",
      "interview": "Interview",
      "offer": "Offer",
      "hired": "Hired",
      "rejected": "Rejected",
    };

    return NextResponse.json({
      jobId,
      status: reverseMap[updated.status] || "Applied",
      appliedAt: updated.applied_at,
    });
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
