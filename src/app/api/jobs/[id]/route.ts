import { NextRequest, NextResponse } from "next/server";

const JOBS = [
  {
    id: "job-1",
    title: "Frontend Engineer",
    company: "Acme Corp",
    location: "Remote",
    description: "Build delightful UIs with React and TypeScript.",
    supplementalQuestions: [
      { id: "why", label: "Why do you want to work here?", required: false, type: "text" },
      { id: "years_exp", label: "How many years of React experience do you have?", required: true, type: "text" },
    ],
  },
  {
    id: "job-2",
    title: "Backend Engineer",
    company: "Globex",
    location: "New York, NY",
    description: "Design scalable APIs and services in Node.js.",
    supplementalQuestions: [],
  },
  {
    id: "job-3",
    title: "Fullstack Developer",
    company: "Initech",
    location: "San Francisco, CA",
    description: "Ship features across the stack in a collaborative team.",
    supplementalQuestions: [
      { id: "proj", label: "Share a project you're proud of", required: false, type: "text" },
    ],
  },
];

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const job = JOBS.find((j) => j.id === id);
  if (!job) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json(job);
}
