import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/jobs - Fetch all open jobs from Supabase
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch all open jobs
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, company, location, description, salary_range, status, deadline')
      .eq('status', 'open')  // Only show open jobs
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { error: "Failed to fetch jobs", details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
