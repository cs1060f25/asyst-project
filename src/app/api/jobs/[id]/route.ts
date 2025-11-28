import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/jobs/[id] - Fetch a specific job by ID
export async function GET(_req: Request, context: unknown) {
  try {
    const supabase = await createClient();
    const jobId = (context as { params: { id: string } }).params.id;
    
    // Fetch job by ID
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, company, location, description, salary_range, status, deadline, requirements')
      .eq('id', jobId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching job:', error);
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }
    
    const supp = data?.requirements && typeof data.requirements === 'object' ? (data.requirements as any).supplementalQuestions : undefined;
    const mapped = {
      ...data,
      supplementalQuestions: Array.isArray(supp) ? supp : undefined,
    };
    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
