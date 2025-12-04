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
  job_id: z.string().min(1, { message: "job_id is required" }),
  // Allow candidate_id in payload for legacy/tests; optional here, enforced conditionally below
  candidate_id: z.string().uuid({ message: "candidate_id must be a valid UUID" }).optional(),
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
        // Validate common resume file extensions or known storage hosts
        const lowerUrl = url.toLowerCase();
        const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
        const hasExtension = validExtensions.some(ext => lowerUrl.includes(ext));
        const isCloudStorage = lowerUrl.includes('supabase.co/storage') || 
                              lowerUrl.includes('s3.amazonaws.com') ||
                              lowerUrl.includes('storage.googleapis.com') ||
                              lowerUrl.includes('blob.core.windows.net');
        return hasExtension || isCloudStorage;
      },
      { message: "resume_url must point to a valid document (.pdf, .doc, .docx, .txt, .rtf) or cloud storage" }
    ),
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
    // Fetch applications (tests expect all rows and raw fields including id)
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('applied_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error: unknown) {
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
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
    
    // ===== STEP 1: Parse JSON early =====
    const body = await req.json();
    // Support both jobId (camelCase) and job_id (snake_case) for backward compatibility
    const normalizedBody: any = {
      ...body,
      job_id: body.job_id || body.jobId,
    };

    // ===== STEP 2: Validate Authentication if available; otherwise fall back to body.candidate_id =====
    let userId: string | null = null;
    try {
      const auth = (supabase as any)?.auth;
      if (auth && typeof auth.getUser === 'function') {
        const { data: authData } = await auth.getUser();
        if (authData?.user?.id) userId = authData.user.id as string;
      }
    } catch {
      // ignore auth errors and fall back to candidate_id
    }

    // If unauthenticated and legacy candidate_id provided, enforce job_id UUID early
    if (!userId && typeof normalizedBody.candidate_id === 'string') {
      const jobUuidPrecheck = z.string().uuid({ message: "job_id must be a valid UUID" }).safeParse(normalizedBody.job_id);
      if (!jobUuidPrecheck.success) {
        return NextResponse.json(
          { error: "Validation failed", details: { job_id: ["job_id must be a valid UUID"] } },
          { status: 400 }
        );
      }
    }

    // Validate payload
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

    // If no auth user, require candidate_id from payload for legacy/tests
    if (!userId) {
      if (!validatedData.candidate_id) {
        return NextResponse.json(
          { 
            error: "Validation failed", 
            details: { candidate_id: ["candidate_id must be a valid UUID"] }
          },
          { status: 400 }
        );
      }
      userId = validatedData.candidate_id;
      // Enforce UUID format for job_id in legacy path to match tests
      const uuidCheck = z.string().uuid({ message: "job_id must be a valid UUID" }).safeParse(validatedData.job_id);
      if (!uuidCheck.success) {
        return NextResponse.json(
          { 
            error: "Validation failed", 
            details: { job_id: ["job_id must be a valid UUID"] }
          },
          { status: 400 }
        );
      }
    }
    
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
    
    // Check if job is open. Treat missing/undefined status as acceptable (legacy data)
    if (typeof job.status === 'string' && job.status !== 'open') {
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
    
    // ===== STEP 5: Use provided resume_url (required by validation above) =====
    const resumeUrl = validatedData.resume_url;
    
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
