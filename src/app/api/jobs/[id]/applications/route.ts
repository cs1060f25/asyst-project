import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/jobs/[id]/applications - Get all applications for a specific job
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const jobId = params.id;
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Verify that the job belongs to this recruiter
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('employer_id')
      .eq('id', jobId)
      .single();
    
    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }
    
    if (job.employer_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only view applications for your own jobs" },
        { status: 403 }
      );
    }
    
    // Fetch all applications for this job with candidate information
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        job_id,
        candidate_id,
        status,
        resume_url,
        cover_letter,
        supplemental_answers,
        applied_at,
        updated_at
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: "Failed to fetch applications", details: error.message },
        { status: 500 }
      );
    }
    
    // Fetch candidate information for each application
    const applicationsWithCandidates = await Promise.all(
      (applications || []).map(async (app) => {
        if (!app.candidate_id) {
          return {
            ...app,
            candidate: null
          };
        }
        
        const { data: candidate } = await supabase
          .from('candidate_profiles')
          .select('name, email, phone, resume_url, linkedin_url, github_url, offer_deadline')
          .eq('user_id', app.candidate_id)
          .single();
        
        return {
          ...app,
          candidate: candidate || null
        };
      })
    );
    
    return NextResponse.json(applicationsWithCandidates);
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
