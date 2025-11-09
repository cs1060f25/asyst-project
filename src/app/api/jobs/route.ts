import { NextRequest, NextResponse } from "next/server";
import { readJobs, createJob } from "@/lib/jobs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const jobs = await readJobs();
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to read jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { title, company, location } = body;
    if (!title || !company || !location) {
      return NextResponse.json(
        { error: "Missing required fields: title, company, location" },
        { status: 400 }
      );
    }

    // Create the job
    const newJob = await createJob({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      description: body.description?.trim() || "",
      supplementalQuestions: body.supplementalQuestions || [],
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error("Failed to create job:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
