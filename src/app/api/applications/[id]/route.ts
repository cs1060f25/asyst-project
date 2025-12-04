import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET - Fetch single application with full candidate details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: applicationId } = await params;

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', application.job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Debug logging
    console.log('[Application Detail] Auth check:', {
      userId: user.id,
      jobEmployerId: job.employer_id,
      match: job.employer_id === user.id
    });

    // Verify recruiter owns this job
    // If employer_id is null, allow any authenticated recruiter (legacy jobs)
    if (job.employer_id && job.employer_id !== user.id) {
      return NextResponse.json({ 
        error: "Forbidden - You don't have permission to view this application" 
      }, { status: 403 });
    }

    // Fetch candidate profile with all details
    const { data: candidate, error: candidateError } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', application.candidate_id)
      .single();

    if (candidateError || !candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Transform status from DB format to API format
    const statusMap: Record<string, string> = {
      applied: 'Applied',
      under_review: 'Under Review',
      interview: 'Interview',
      offer: 'Offer',
      hired: 'Hired',
      rejected: 'Rejected',
    };

    // Return full application details
    return NextResponse.json({
      application: {
        id: application.id,
        jobId: application.job_id,
        candidateId: application.candidate_id,
        status: statusMap[application.status] || 'Applied',
        resumeUrl: application.resume_url,
        coverLetter: application.cover_letter,
        supplementalAnswers: application.supplemental_answers,
        appliedAt: application.applied_at,
        updatedAt: application.updated_at,
      },
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        salaryRange: job.salary_range,
        requirements: job.requirements,
        supplementalQuestions: job.requirements && typeof job.requirements === 'object' 
          ? (job.requirements as any).supplementalQuestions 
          : undefined,
        status: job.status,
      },
      candidate: {
        userId: candidate.user_id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        education: candidate.education,
        resumeUrl: candidate.resume_url,
        skills: candidate.skills,
        experience: candidate.experience,
        certifications: candidate.certifications,
        linkedinUrl: candidate.linkedin_url,
        githubUrl: candidate.github_url,
        portfolioUrl: candidate.portfolio_url,
        offerDeadline: candidate.offer_deadline,
      },
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update application status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: applicationId } = await params;
    const body = await req.json();
    const status = body?.status as string;

    // Validate status
    const validStatuses = ["Applied", "Under Review", "Interview", "Offer", "Hired", "Rejected"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the application to check authorization
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select("candidate_id, job_id")
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if user owns this application OR owns the job (recruiter)
    const { data: job } = await supabase
      .from("jobs")
      .select("employer_id")
      .eq("id", application.job_id)
      .single();

    const isJobOwner = job?.employer_id === authData.user.id;
    const isCandidate = application.candidate_id === authData.user.id;

    if (!isJobOwner && !isCandidate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Map frontend status to DB enum format
    const statusMap: Record<string, string> = {
      "Applied": "applied",
      "Under Review": "under_review",
      "Interview": "interview",
      "Offer": "offer",
      "Hired": "hired",
      "Rejected": "rejected",
    };

    const dbStatus = statusMap[status];

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
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Return in frontend format
    const reverseMap: Record<string, string> = {
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
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
