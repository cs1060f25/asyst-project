import { NextResponse } from "next/server";
import { getApplicationsWithCandidateInfo } from "@/lib/applications";

export const runtime = "nodejs";

export async function GET() {
  const apps = await getApplicationsWithCandidateInfo();
  return NextResponse.json(apps);
}
