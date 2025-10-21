import { NextRequest, NextResponse } from "next/server";
import {
  readProfile,
  writeProfile,
  saveResumeFile,
  deleteResumeFileIfExists,
  isAllowedResumeType,
  MAX_RESUME_BYTES,
} from "@/lib/storage";

export const runtime = "nodejs";

// Upload or replace resume
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
    }

    if (!isAllowedResumeType(file.type)) {
      return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
    }

    if ((file as any).size && (file as any).size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
    }

    const existing = await readProfile();
    // Save new resume
    const saved = await saveResumeFile(file);

    // Delete old resume if exists
    await deleteResumeFileIfExists(existing.resume ?? null);

    const updated = { ...existing, resume: saved };
    await writeProfile(updated);

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}

// Delete resume
export async function DELETE() {
  try {
    const existing = await readProfile();
    if (!existing.resume) {
      return NextResponse.json({ error: "NO_RESUME" }, { status: 400 });
    }

    await deleteResumeFileIfExists(existing.resume);
    const updated = { ...existing, resume: null };
    await writeProfile(updated);

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
}
