import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Mocked jobs list for now
const JOBS = [
  { id: "job-1", title: "Frontend Engineer", company: "Acme Corp", location: "Remote" },
  { id: "job-2", title: "Backend Engineer", company: "Globex", location: "New York, NY" },
  { id: "job-3", title: "Fullstack Developer", company: "Initech", location: "San Francisco, CA" },
];

export async function GET() {
  return NextResponse.json(JOBS);
}
