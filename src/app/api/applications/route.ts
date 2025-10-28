import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { Application, ApplicationInsert } from "@/lib/types/database";

export const runtime = "nodejs";

// =============================================
// VALIDATION SCHEMA
// =============================================
const ApplicationCreateSchema = z.object({
  job_id: z.string().uuid({ message: "job_id must be a valid UUID" }),
  candidate_id: z.string().uuid({ message: "candidate_id must be a valid UUID" }),
  resume_url: z.string().url({ message: "resume_url must be a valid URL" }).nullable().optional(),
  cover_letter: z.string().max(5000, { message: "cover_letter must be less than 5000 characters" }).nullable().optional(),
  supplemental_answers: z.record(z.string(), z.any()).nullable().optional(),
});

// =============================================
// GET /api/applications
// Fetch all applications
// =============================================
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: "Failed to fetch applications", details: error.message },
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

// =============================================
// POST /api/applications
// Create a new application
// =============================================
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate with Zod
    const validationResult = ApplicationCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;
    const supabase = await createClient();
    
    // Check if candidate already applied to this job
    const { data: existingApplication, error: checkError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', validatedData.job_id)
      .eq('candidate_id', validatedData.candidate_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for duplicate:', checkError);
      return NextResponse.json(
        { error: "Failed to check existing applications", details: checkError.message },
        { status: 500 }
      );
    }
    
    // Return 409 if duplicate application found
    if (existingApplication) {
      return NextResponse.json(
        { 
          error: "Duplicate application",
          message: "You have already applied to this job",
          existing: existingApplication
        },
        { status: 409 }
      );
    }
    
    // Verify job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company')
      .eq('id', validatedData.job_id)
      .single();
    
    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found", message: "The specified job does not exist" },
        { status: 404 }
      );
    }
    
    // Insert new application
    const applicationData: ApplicationInsert = {
      job_id: validatedData.job_id,
      candidate_id: validatedData.candidate_id,
      resume_url: validatedData.resume_url || null,
      cover_letter: validatedData.cover_letter || null,
      supplemental_answers: validatedData.supplemental_answers || null,
      status: 'applied',
    };
    
    const { data: newApplication, error: insertError } = await supabase
      .from('applications')
      .insert(applicationData)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting application:', insertError);
      return NextResponse.json(
        { error: "Failed to create application", details: insertError.message },
        { status: 500 }
      );
    }
    
    // Return 201 Created with the new application
    return NextResponse.json(
      { 
        message: "Application created successfully",
        application: newApplication,
        job: job
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Unexpected error in POST /api/applications:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
