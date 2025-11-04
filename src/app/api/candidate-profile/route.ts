import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCandidateProfile, safeSaveCandidateProfile, safeUpdateCandidateProfile } from "@/lib/candidate-profile";

export const runtime = "nodejs";

async function getAuthedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

export async function GET() {
  try {
    const userId = await getAuthedUserId();
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const profile = await fetchCandidateProfile(userId);
    return NextResponse.json(profile);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getAuthedUserId();
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "BAD_REQUEST" }, { status: 400 });
  }
}
