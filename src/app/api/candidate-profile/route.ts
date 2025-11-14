import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCandidateProfile, safeSaveCandidateProfile, safeUpdateCandidateProfile } from "@/lib/candidate-profile";

export const runtime = "nodejs";

async function getAuthedUserId(req?: NextRequest) {
  // Try SSR cookies first
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  if (data?.session?.user?.id) return data.session.user.id;

  // Fallback: Authorization: Bearer <access_token>
  if (req) {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice(7);
      try {
        const { data: userData, error } = await supabase.auth.getUser(token);
        if (!error && userData?.user?.id) return userData.user.id;
      } catch {}
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthedUserId(req);
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED: no session" }, { status: 401 });

    const profile = await fetchCandidateProfile(userId);
    return NextResponse.json(profile);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getAuthedUserId(req);
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json();

    const existing = await fetchCandidateProfile(userId);
    if (existing) {
      const result = await safeUpdateCandidateProfile(userId, body);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result.data);
    } else {
      const result = await safeSaveCandidateProfile(userId, body);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result.data);
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "BAD_REQUEST" }, { status: 400 });
  }
}
