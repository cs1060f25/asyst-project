import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Upload or replace resume
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "MISSING_FILE" }, { status: 400 });
    }

    const ALLOWED_TYPES = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]);
    const MAX_BYTES = 5 * 1024 * 1024; // 5MB

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
    }

    // Upload to Supabase Storage (bucket: "resumes")
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file as unknown as Blob, {
      contentType: file.type,
      upsert: true,
    });
    if (uploadError) {
      return NextResponse.json({ error: "UPLOAD_FAILED", message: (uploadError as any).message ?? String(uploadError) }, { status: 500 });
    }

    // Get public URL
    const { data: publicData } = await supabase.storage.from("resumes").getPublicUrl(path);
    const publicUrl = publicData.publicUrl;

    // Update candidate profile with resume metadata and legacy url
    const { data: updatedRows, error: updateError } = await supabase
      .from('candidate_profiles')
      .update({
        resume_url: publicUrl,
        resume_path: path,
        resume_original_name: file.name,
        resume_mime: file.type,
        resume_size: file.size,
        resume_updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('user_id');
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json({ error: 'PROFILE_NOT_FOUND' }, { status: 404 });
    }

    // Return legacy profile-shaped response
    return NextResponse.json({
      name: "",
      email: "",
      education: "",
      resume: {
        url: publicUrl,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        updatedAt: new Date().toISOString(),
      },
      offerDeadline: null,
    });
  } catch {
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}

// Delete resume
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    // Fetch existing resume_url
    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('resume_url')
      .eq('user_id', userId)
      .maybeSingle();

    const url = profile?.resume_url || null;

    // Best-effort delete from storage if we can parse the path
    if (url && url.includes('/object/public/resumes/')) {
      const idx = url.indexOf('/object/public/resumes/');
      const path = url.slice(idx + '/object/public/resumes/'.length);
      await supabase.storage.from('resumes').remove([path]);
    }

    // Update DB - clear metadata and legacy url
    const { error: updateError } = await supabase
      .from('candidate_profiles')
      .update({
        resume_url: null,
        resume_path: null,
        resume_original_name: null,
        resume_mime: null,
        resume_size: null,
        resume_updated_at: null,
      })
      .eq('user_id', userId);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    return NextResponse.json({
      name: "",
      email: "",
      education: "",
      resume: null,
      offerDeadline: null,
    });
  } catch {
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }
}

