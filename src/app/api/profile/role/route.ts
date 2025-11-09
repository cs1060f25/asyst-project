import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET /api/profile/role - Get user role
export async function GET(req: NextRequest) {
  try {
    // Get the current user from Supabase session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const role = await getUserRole(user.id);

    if (!role) {
      return NextResponse.json(
        { error: "User role not found. Please complete your profile setup." },
        { status: 404 }
      );
    }

    return NextResponse.json({ role, user_id: user.id });
  } catch (error: any) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role" },
      { status: 500 }
    );
  }
}
