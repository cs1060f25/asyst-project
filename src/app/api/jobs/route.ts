import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Mocked jobs list for now
const JOBS = [
  {
    id: "job-1",
    title: "Frontend Engineer",
    company: "Acme Corp",
    location: "Remote",
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
    supplementalQuestions: [],
  },
  {
    id: "job-3",
    title: "Fullstack Developer",
    company: "Initech",
    location: "San Francisco, CA",
    supplementalQuestions: [
      { id: "proj", label: "Share a project you're proud of", required: false, type: "text" },
    ],
  },
];

export async function GET() {
  return NextResponse.json(JOBS);
}
