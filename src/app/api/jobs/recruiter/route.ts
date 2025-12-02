import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/jobs/recruiter - Fetch all jobs created by the authenticated recruiter
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Fetch all jobs created by this recruiter
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        company,
        location,
        description,
        salary_range,
        status,
        deadline,
        created_at,
        employer_id,
        requirements
      `)
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching recruiter jobs:', error);
      return NextResponse.json(
        { error: "Failed to fetch jobs", details: error.message },
        { status: 500 }
      );
    }
    
    // Count applications for each job
    const jobsWithCounts = await Promise.all(
      (data || []).map(async (job) => {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id);
        
        return {
          ...job,
          applicationCount: count || 0
        };
      })
    );
    
    return NextResponse.json(jobsWithCounts);
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
