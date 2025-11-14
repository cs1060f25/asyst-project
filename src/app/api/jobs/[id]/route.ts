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
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching job:', error);
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
