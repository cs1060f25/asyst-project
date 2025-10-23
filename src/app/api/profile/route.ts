import { NextRequest, NextResponse } from "next/server";
import { readProfile, writeProfile, type Profile } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const profile = await readProfile();
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Profile>;

    // Basic validation
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const education = typeof body.education === "string" ? body.education.trim() : "";
    const offerDeadline = typeof body.offerDeadline === "string" ? body.offerDeadline : null;

    if (!name) return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    
    // Validate offer deadline if provided
    if (offerDeadline && !isValidDate(offerDeadline)) {
      return NextResponse.json({ error: "INVALID_OFFER_DEADLINE" }, { status: 400 });
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
