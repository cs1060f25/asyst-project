import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();

    type DbApplication = { job_id: string; status: string; applied_at: string; candidate_id: string };
    type CandidateProfile = { user_id: string; name: string | null; email: string | null; offer_deadline: string | null; resume_url: string | null };

    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('job_id, status, applied_at, candidate_id')
      .order('applied_at', { ascending: false });

    if (appsError || !apps) {
      return NextResponse.json([], { status: 200 });
    }

    const candidateIds = Array.from(new Set(apps.map(a => a.candidate_id))).filter(Boolean);

    const profilesMap = new Map<string, CandidateProfile>();
    if (candidateIds.length > 0) {
      const { data: profiles } = await supabase
        .from('candidate_profiles')
        .select('user_id, name, email, offer_deadline, resume_url')
        .in('user_id', candidateIds);
      for (const p of profiles || []) profilesMap.set(p.user_id, p);
    }

    const statusMap: Record<string, string> = {
      applied: 'Applied',
      under_review: 'Under Review',
      interview: 'Interview',
      offer: 'Offer',
      hired: 'Hired',
      rejected: 'Rejected',
    };

    const transformed = (apps as DbApplication[]).map(row => {
      const prof = profilesMap.get(row.candidate_id);
      return {
        jobId: row.job_id,
        status: statusMap[row.status] || 'Applied',
        appliedAt: row.applied_at,
        candidateInfo: prof ? {
          name: prof.name || 'Anonymous',
          email: prof.email || '',
          offerDeadline: prof.offer_deadline || null,
          resumeUrl: prof.resume_url || null,
        } : undefined,
      };
    });

    return NextResponse.json(transformed);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

