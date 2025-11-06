import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test query: fetch all jobs
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(5);
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Supabase connection successful!",
      jobCount: data?.length || 0,
      jobs: data
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      success: false, 
      error: message
    }, { status: 500 });
  }
}
