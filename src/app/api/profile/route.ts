import { NextRequest, NextResponse } from "next/server";
import { readProfile, writeProfile, type Profile } from "@/lib/storage";
import { 
  safeSaveCandidateProfile, 
  safeUpdateCandidateProfile, 
  fetchCandidateProfile 
} from "@/lib/candidate-profile";

export const runtime = "nodejs";

export async function GET() {
  // For backward compatibility, return the existing Profile format
  const profile = await readProfile();
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if this is a request for the new candidate profile system
    if (body.user_id) {
      // Use the new validation and normalization system
      const result = await safeUpdateCandidateProfile(body.user_id, body);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result.data);
    }
    
    // Legacy Profile system (backward compatibility)
    const profileData = body as Partial<Profile>;

    // Basic validation
    const name = typeof profileData.name === "string" ? profileData.name.trim() : "";
    const email = typeof profileData.email === "string" ? profileData.email.trim() : "";
    const education = typeof profileData.education === "string" ? profileData.education.trim() : "";
    const offerDeadline = typeof profileData.offerDeadline === "string" ? profileData.offerDeadline : null;

    if (!name) return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    
    // Validate offer deadline if provided
    if (offerDeadline && !isValidDate(offerDeadline)) {
      return NextResponse.json({ error: "INVALID_OFFER_DEADLINE" }, { status: 400 });
    }
    
    // Ensure offer deadline is in the future
    if (offerDeadline) {
      const deadlineDate = new Date(offerDeadline);
      const now = new Date();
      if (deadlineDate <= now) {
        return NextResponse.json({ error: "OFFER_DEADLINE_MUST_BE_FUTURE" }, { status: 400 });
      }
    }

    const existing = await readProfile();
    const updated: Profile = {
      name,
      email,
      education,
      resume: existing.resume ?? null,
      offerDeadline,
    };

    await writeProfile(updated);
    return NextResponse.json(updated);
  } catch (e: any) {
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
