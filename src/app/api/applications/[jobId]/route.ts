import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ApplicationStatus = "Applied" | "Under Review" | "Interview" | "Offer" | "Hired" | "Rejected";

export const runtime = "nodejs";

export async function PATCH(req: Request, context: unknown) {
  try {
    const params = await (context as { params: Promise<{ jobId: string }> }).params;
    const { jobId: applicationId } = params; // jobId param is actually application ID
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

    // Get the application to check authorization
    const { data: application } = await supabase
      .from("applications")
      .select("candidate_id, job_id")
      .eq("id", applicationId)
      .single();

    if (!application) {
      return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });
    }

    // Check if user owns this application OR owns the job (recruiter)
    const isCandidate = application.candidate_id === authData.user.id;
    
    // Note: We can't check recruiter status without a recruiter_id column in jobs table
    // For now, allow any authenticated user to update (will need to add recruiter check later)
    
    // Update the application
    const { data: updated, error: updateError } = await supabase
      .from("applications")
      .update({ status: dbStatus })
      .eq("id", applicationId)
      .select()
      .single();

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
      id: updated.id,
      jobId: updated.job_id,
      status: reverseMap[updated.status] || "Applied",
      appliedAt: updated.applied_at,
    });
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}
