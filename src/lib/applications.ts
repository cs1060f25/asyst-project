import { promises as fs } from "fs";
import path from "path";

export type SupplementalQuestion = {
  id: string;
  question: string;
  type: "text" | "textarea" | "select";
  options?: string[]; // For select type questions
  required: boolean;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  supplementalQuestions?: SupplementalQuestion[];
};

export type ApplicationStatus = "Applied" | "Under Review" | "Interview" | "Offer" | "Hired" | "Rejected";

export type SupplementalAnswer = {
  questionId: string;
  answer: string;
};

export type Application = {
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
  supplementalAnswers?: SupplementalAnswer[];
};

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const DEFAULT_APPS_PATH = path.join(DEFAULT_DATA_DIR, "applications.json");

function getAppsPath() {
  return process.env.APPLICATIONS_JSON || DEFAULT_APPS_PATH;
}

export async function ensureDataDir() {
  await fs.mkdir(DEFAULT_DATA_DIR, { recursive: true });
}

export async function readApplications(): Promise<Application[]> {
  try {
    const raw = await fs.readFile(getAppsPath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeApplications(apps: Application[]) {
  await ensureDataDir();
  await fs.writeFile(getAppsPath(), JSON.stringify(apps, null, 2), "utf-8");
}

export function getApplicationStatus(apps: Application[], jobId: string): ApplicationStatus | null {
  const id = jobId.trim();
  const app = apps.find((a) => a.jobId === id);
  return app ? app.status : null;
}

export async function applyToJob(jobId: string, supplementalAnswers?: SupplementalAnswer[]): Promise<{ created: boolean; status: ApplicationStatus }> {
  const id = jobId.trim();
  if (!id) {
    throw new Error("INVALID_JOB_ID");
  }
  const apps = await readApplications();
  const existing = apps.find((a) => a.jobId === id);
  if (existing) {
    return { created: false, status: existing.status };
  }
  const newApp: Application = {
    jobId: id,
    status: "Applied",
    appliedAt: new Date().toISOString(),
    supplementalAnswers: supplementalAnswers || [],
  };
  const updated = [...apps, newApp];
  await writeApplications(updated);
  return { created: true, status: newApp.status };
}

export async function updateApplicationStatus(jobId: string, status: ApplicationStatus): Promise<{ success: boolean; application?: Application }> {
  const id = jobId.trim();
  if (!id) {
    throw new Error("INVALID_JOB_ID");
  }
  const apps = await readApplications();
  const appIndex = apps.findIndex((a) => a.jobId === id);
  if (appIndex === -1) {
    return { success: false };
  }
  apps[appIndex].status = status;
  await writeApplications(apps);
  return { success: true, application: apps[appIndex] };
}

export type ApplicationWithCandidate = Application & {
  candidateInfo?: {
    name: string;
    email: string;
    offerDeadline: string | null;
    resumeUrl: string | null;
  };
};

export async function getApplicationsWithCandidateInfo(): Promise<ApplicationWithCandidate[]> {
  const apps = await readApplications();
  
  // For now, we'll use a single profile since this is a demo
  // In a real app, each application would be linked to a specific candidate
  try {
    const { readProfile } = await import("./storage");
    const profile = await readProfile();
    
    return apps.map(app => ({
      ...app,
      candidateInfo: {
        name: profile.name || "Anonymous",
        email: profile.email || "",
        offerDeadline: profile.offerDeadline,
        resumeUrl: profile.resume?.url || null,
      }
    }));
  } catch {
    // If profile reading fails, return apps without candidate info
    return apps;
  }
}
