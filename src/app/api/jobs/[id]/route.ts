import { NextRequest, NextResponse } from "next/server";

const JOBS = [
  { id: "job-1", title: "Frontend Engineer", company: "Acme Corp", location: "Remote", description: "Build delightful UIs with React and TypeScript." },
  { id: "job-2", title: "Backend Engineer", company: "Globex", location: "New York, NY", description: "Design scalable APIs and services in Node.js." },
  { id: "job-3", title: "Fullstack Developer", company: "Initech", location: "San Francisco, CA", description: "Ship features across the stack in a collaborative team." },
];

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = JOBS.find((j) => j.id === id);
  if (!job) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json(job);
}
