import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/jobs - Fetch all open jobs from Supabase with filtering and sorting
// Query params:
//   - filter: 'urgent' | 'week' | 'month' | 'no_deadline' | 'all' (default: 'all')
//   - sort: 'deadline_asc' | 'deadline_desc' | 'created_desc' | 'title_asc' (default: 'deadline_asc')
//   - showExpired: 'true' | 'false' (default: 'false')
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const filter = searchParams.get('filter') || 'all';
    const sort = searchParams.get('sort') || 'deadline_asc';
    const showExpired = searchParams.get('showExpired') === 'true';
    
    // Start building query
    let query = supabase
      .from('jobs')
      .select('id, title, company, location, description, salary_range, status, deadline, created_at')
      .eq('status', 'open');  // Only show open jobs
    
    // Apply deadline filtering
    const now = new Date().toISOString();
    
    switch (filter) {
      case 'urgent':
        // Jobs with deadline < 3 days from now
        const urgent = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        query = query
          .not('deadline', 'is', null)
          .gte('deadline', now)
          .lt('deadline', urgent);
        break;
        
      case 'week':
        // Jobs with deadline < 7 days from now
        const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query
          .not('deadline', 'is', null)
          .gte('deadline', now)
          .lt('deadline', week);
        break;
        
      case 'month':
        // Jobs with deadline < 30 days from now
        const month = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query
          .not('deadline', 'is', null)
          .gte('deadline', now)
          .lt('deadline', month);
        break;
        
      case 'no_deadline':
        // Jobs with no deadline
        query = query.is('deadline', null);
        break;
        
      case 'all':
      default:
        // All jobs, optionally exclude expired
        if (!showExpired) {
          // Show jobs with no deadline OR deadline in the future
          query = query.or(`deadline.is.null,deadline.gte.${now}`);
        }
        break;
    }
    
    // Apply sorting
    switch (sort) {
      case 'deadline_asc':
        // Earliest deadline first (nulls last)
        query = query.order('deadline', { ascending: true, nullsFirst: false });
        break;
        
      case 'deadline_desc':
        // Latest deadline first (nulls last)
        query = query.order('deadline', { ascending: false, nullsFirst: false });
        break;
        
      case 'created_desc':
        // Recently posted first
        query = query.order('created_at', { ascending: false });
        break;
        
      case 'title_asc':
        // Alphabetical A-Z
        query = query.order('title', { ascending: true });
        break;
        
      default:
        query = query.order('deadline', { ascending: true, nullsFirst: false });
    }
    
    const { data, error } = await query;
    
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
