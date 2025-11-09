import { NextRequest, NextResponse } from "next/server";
import { createRecruiterProfile, getRecruiterProfile, updateRecruiterProfile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { RecruiterProfileInsert } from "@/lib/types/database";

export const runtime = "nodejs";

// GET /api/profile/recruiter - Get recruiter profile
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const profile = await getRecruiterProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("Error fetching recruiter profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// POST /api/profile/recruiter - Create recruiter profile
export async function POST(req: NextRequest) {
  try {
    // Verify user session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - please sign in first" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate required fields
    const { user_id, name, email, company_name, job_title } = body;
    
    // Ensure user can only create their own profile
    if (user_id !== user.id) {
      return NextResponse.json(
        { error: "Cannot create profile for another user" },
        { status: 403 }
      );
    }

    if (!user_id || !name || !email || !company_name || !job_title) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, name, email, company_name, job_title" },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const existingProfile = await getRecruiterProfile(user_id);
    if (existingProfile) {
      return NextResponse.json(
        { error: "Profile already exists for this user" },
        { status: 409 }
      );
    }

    const profileData: RecruiterProfileInsert = {
      user_id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company_name: company_name.trim(),
      job_title: job_title.trim(),
      company_size: body.company_size || null,
      phone: body.phone || null,
      linkedin_url: body.linkedin_url || null,
      company_website: body.company_website || null,
    };

    const newProfile = await createRecruiterProfile(profileData);

    return NextResponse.json(newProfile, { status: 201 });
  } catch (error: any) {
    console.error("Error creating recruiter profile:", error);
    console.error("Full error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to create profile", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/profile/recruiter - Update recruiter profile
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, ...updates } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Check if profile exists
    const existingProfile = await getRecruiterProfile(user_id);
    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const updatedProfile = await updateRecruiterProfile(user_id, updates);

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error("Error updating recruiter profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
