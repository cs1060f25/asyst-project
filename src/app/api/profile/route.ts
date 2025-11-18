import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeUpdateCandidateProfile } from "@/lib/candidate-profile";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getSession();

    // If not authenticated, return empty legacy profile shape
    if (!sessionData.session?.user?.id) {
      return NextResponse.json({ name: "", email: "", education: "", resume: null, offerDeadline: null });
    }

    const userId = sessionData.session.user.id;
    const { data } = await supabase
      .from('candidate_profiles')
      .select('name, email, education, resume_url, offer_deadline')
      .eq('user_id', userId)
      .maybeSingle();

    const metaFull = sessionData.session.user.user_metadata?.full_name as string | undefined;
    const computedName = (typeof metaFull === 'string' && metaFull.trim())
      ? metaFull.trim()
      : ((data && data.name) || "");

    // Map to legacy Profile shape expected by UI
    const legacy = {
      name: computedName,
      email: (data && data.email) || "",
      education: (data && data.education) || "",
      resume: data && data.resume_url ? {
        url: data.resume_url,
        originalName: "",
        size: 0,
        mimeType: "",
        updatedAt: new Date().toISOString(),
      } : null,
      offerDeadline: (data && data.offer_deadline) || null,
    };

    return NextResponse.json(legacy);
  } catch {
    return NextResponse.json({ name: "", email: "", education: "", resume: null, offerDeadline: null });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();

    // New system path support remains
    if (body.user_id) {
      const result = await safeUpdateCandidateProfile(body.user_id, body);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result.data);
    }

    // Legacy fields validation -> update candidate_profiles
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const education = typeof body.education === "string" ? body.education.trim() : "";
    const offerDeadline = typeof body.offerDeadline === "string" ? body.offerDeadline : null;

    if (!name) return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    if (offerDeadline && !isValidDate(offerDeadline)) {
      return NextResponse.json({ error: "INVALID_OFFER_DEADLINE" }, { status: 400 });
    }
    if (offerDeadline) {
      const deadlineDate = new Date(offerDeadline);
      const now = new Date();
      if (deadlineDate <= now) {
        return NextResponse.json({ error: "OFFER_DEADLINE_MUST_BE_FUTURE" }, { status: 400 });
      }
    }

    const userId = sessionData.session.user.id;

    // Keep Supabase Auth display name in sync with profile name
    try {
      await supabase.auth.updateUser({ data: { full_name: name } });
    } catch {}

    // Upsert candidate profile basic fields
    const { data: existing } = await supabase
      .from('candidate_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update({ name, email, education, offer_deadline: offerDeadline })
        .eq('user_id', userId);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
    } else {
      const { error: insertError } = await supabase
        .from('candidate_profiles')
        .insert({ user_id: userId, name, email, education, offer_deadline: offerDeadline });
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({
      name,
      email,
      education,
      resume: null, // resume managed via /api/resume
      offerDeadline,
    });
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(dateString: string) {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}

