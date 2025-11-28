import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { ApplicationInsert } from "@/lib/types/database";

export const runtime = "nodejs";

// =============================================
// VALIDATION SCHEMA
// =============================================
// NOTE: candidate_id is NOT in the schema - it comes from authenticated session
const ApplicationCreateSchema = z.object({
  job_id: z.string().uuid({ message: "job_id must be a valid UUID" }),
  resume_url: z.string()
    .min(1, { message: "resume_url cannot be empty" })
    .url({ message: "resume_url must be a valid URL" })
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      { message: "resume_url must be an HTTP or HTTPS URL" }
    )
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          // Prevent dangerous protocols
          return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: "resume_url must use HTTP or HTTPS protocol" }
    )
    .refine(
      (url) => {
        // Optional: Validate common resume file extensions
        const lowerUrl = url.toLowerCase();
        const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
        // Check if URL ends with a valid extension or has no extension (for cloud storage URLs)
        const hasExtension = validExtensions.some(ext => lowerUrl.includes(ext));
        const isCloudStorage = lowerUrl.includes('supabase.co/storage') || 
                              lowerUrl.includes('s3.amazonaws.com') ||
                              lowerUrl.includes('storage.googleapis.com') ||
                              lowerUrl.includes('blob.core.windows.net');
        return hasExtension || isCloudStorage;
      },
      { message: "resume_url must point to a valid document (.pdf, .doc, .docx, .txt, .rtf) or cloud storage" }
    )
    .optional(),  // Make resume_url optional
  cover_letter: z.string().max(5000, { message: "cover_letter must be less than 5000 characters" }).nullable().optional(),
  supplemental_answers: z.record(z.string(), z.any()).nullable().optional(),
});

// =============================================
// GET /api/applications
// Fetch all applications for the authenticated user
// Returns frontend-compatible format
// =============================================
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      // Return empty array for unauthenticated users (frontend handles this gracefully)
      return NextResponse.json([]);
    }
    
    // Fetch applications for this user
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('candidate_id', authData.user.id)
      .order('applied_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json([]);
    }
    
    // Transform to frontend format (camelCase)
    const transformed = (data || []).map(app => ({
      jobId: app.job_id,
      status: capitalizeStatus(app.status),
      appliedAt: app.applied_at
    }));
    
    return NextResponse.json(transformed);
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return NextResponse.json([]);
  }
}

// Helper to convert database status to frontend format
function capitalizeStatus(status: string) {
  const map: Record<string, string> = {
    'applied': 'Applied',
    'under_review': 'Under Review',
    'interview': 'Interview',
    'offer': 'Offer',
    'hired': 'Hired',
    'rejected': 'Rejected'
  };
  return map[status] || 'Applied';
}

// =============================================
// POST /api/applications
// Create a new application (SECURE VERSION)
// =============================================
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // ===== STEP 1: Validate Authentication =====
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in to apply" },
        { status: 401 }
      );
    }
    
    const userId = authData.user.id;
    
    // ===== STEP 2: Parse and Validate Request Body =====
    const body = await req.json();
    
    // Support both jobId (camelCase) and job_id (snake_case) for backward compatibility
    const normalizedBody: any = {
      ...body,
      job_id: body.job_id || body.jobId
    };
    
    // Normalize supplemental answers from various payload shapes into a flat record
    // 1) supplemental_answers: Record<string, any>
    // 2) supplementalAnswers: Array<{ questionId: string; answer: string }>
    // 3) details: { answers: Record<string, string> }
    const answersRecord: Record<string, string> | null = (() => {
      if (normalizedBody.supplemental_answers && typeof normalizedBody.supplemental_answers === 'object') {
        return normalizedBody.supplemental_answers as Record<string, string>;
      }
      if (Array.isArray(normalizedBody.supplementalAnswers)) {
        const out: Record<string, string> = {};
        for (const item of normalizedBody.supplementalAnswers) {
          if (item && typeof item === 'object' && typeof item.questionId === 'string') {
            out[item.questionId] = String(item.answer ?? '').trim();
          }
        }
        return out;
      }
      if (normalizedBody.details && typeof normalizedBody.details === 'object' && normalizedBody.details.answers) {
        return normalizedBody.details.answers as Record<string, string>;
      }
      return null;
    })();
    normalizedBody.supplemental_answers = answersRecord;

    const validationResult = ApplicationCreateSchema.safeParse(normalizedBody);
    
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
    
    // ===== STEP 3: Check for Duplicate Application =====
    const { data: existingApplication, error: checkError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('job_id', validatedData.job_id)
      .eq('candidate_id', userId)  // Use authenticated user's ID
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for duplicate:', checkError);
      return NextResponse.json(
        { error: "Failed to check existing applications", details: checkError.message },
        { status: 500 }
      );
    }
    
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
    
    // ===== STEP 4: Verify Job Exists =====
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, status, requirements')
      .eq('id', validatedData.job_id)
      .single();
    
    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found", message: "The specified job does not exist" },
        { status: 404 }
      );
    }
    
    // Check if job is open
    if (job.status !== 'open') {
      return NextResponse.json(
        { 
          error: "Job not accepting applications", 
          message: `This job is currently ${job.status} and not accepting new applications`,
          job_status: job.status
        },
        { status: 403 }
      );
    }
    
    // Enforce required supplemental questions if present
    const reqs = job.requirements && typeof job.requirements === 'object' ? (job.requirements as any) : null;
    const supplemental = reqs?.supplementalQuestions;
    if (Array.isArray(supplemental) && supplemental.length > 0) {
      const requiredIds: string[] = supplemental.filter((q: any) => q && q.required).map((q: any) => q.id).filter((id: any) => typeof id === 'string');
      if (requiredIds.length > 0) {
        const provided = answersRecord || {};
        const missing: string[] = [];
        for (const qid of requiredIds) {
          const val = (provided[qid] ?? '').toString().trim();
          if (!val) missing.push(qid);
        }
        if (missing.length > 0) {
          return NextResponse.json(
            { 
              error: "Supplemental questions required",
              missing_required_questions: missing,
              message: "Please complete all required supplemental questions before applying."
            },
            { status: 400 }
          );
        }
      }
    }
    
    // ===== STEP 5: Get Resume URL from Profile (if not provided) =====
    let resumeUrl = validatedData.resume_url;
    
    if (!resumeUrl) {
      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('resume_url')
        .eq('user_id', userId)
        .maybeSingle();
      
      resumeUrl = profile?.resume_url || "https://placeholder.com/resume.pdf";
    }
    
    // ===== STEP 6: Insert New Application =====
    const applicationData: ApplicationInsert = {
      job_id: validatedData.job_id,
      candidate_id: userId,  // 🔒 SECURE: Use authenticated user's ID
      resume_url: resumeUrl,
      cover_letter: (normalizedBody.details?.coverLetter ?? validatedData.cover_letter) || null,
      supplemental_answers: answersRecord || null,
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
    
    // ===== STEP 7: Return Success (Frontend-compatible format) =====
    return NextResponse.json(
      { 
        created: true,
        status: capitalizeStatus(newApplication.status),
        message: "Application created successfully",
        application: newApplication,
        job: {
          id: job.id,
          title: job.title,
          company: job.company
        }
      },
      { status: 201 }
    );
    
  } catch (error: unknown) {
    console.error('Unexpected error in POST /api/applications:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
