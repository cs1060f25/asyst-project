import { NextRequest, NextResponse } from "next/server";
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

// POST /api/jobs - Create a new job (Supabase version)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    
    // Validate required fields
    const { title, company, location } = body;
    if (!title || !company || !location) {
      return NextResponse.json(
        { error: "Missing required fields: title, company, location" },
        { status: 400 }
      );
    }

    // Create the job in Supabase
    const { data: newJob, error } = await supabase
      .from('jobs')
      .insert({
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        description: body.description?.trim() || null,
        salary_range: body.salary_range || null,
        requirements: body.supplementalQuestions ? { supplementalQuestions: body.supplementalQuestions } : null,
        status: 'open',
        deadline: body.deadline || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json(
        { error: "Failed to create job", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(newJob, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create job:", error);
    return NextResponse.json(
      { error: "Failed to create job", details: error.message },
      { status: 500 }
    );
  }
}
