import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // ===== Test 1: Authentication =====
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const isAuthenticated = !authError && !!authData.user;
    const currentUser = authData.user;
    
    // ===== Test 2: Database Connection (Jobs) =====
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(5);
    
    // ===== Test 3: Applications Table =====
    const { data: appsData, error: appsError } = await supabase
      .from('applications')
      .select('*')
      .limit(5);
    
    // ===== Test 4: Candidate Profiles =====
    let profileData = null;
    let profileError = null;
    
    if (currentUser) {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      profileData = data;
      profileError = error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Supabase connection and auth test complete!",
      
      // Auth info
      auth: {
        isAuthenticated,
        user: isAuthenticated ? {
          id: currentUser?.id,
          email: currentUser?.email,
          createdAt: currentUser?.created_at
        } : null
      },
      
      // Database tables
      database: {
        jobs: {
          success: !jobsError,
          count: jobsData?.length || 0,
          sample: jobsData?.[0] || null,
          error: jobsError?.message
        },
        applications: {
          success: !appsError,
          count: appsData?.length || 0,
          sample: appsData?.[0] || null,
          error: appsError?.message
        },
        candidateProfile: {
          exists: !!profileData,
          data: profileData,
          error: profileError?.message
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
