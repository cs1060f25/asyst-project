import { promises as fs } from "fs";
import path from "path";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
};

export type ApplicationStatus = "Applied" | "Under Review";

export type Application = {
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
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
  const app = apps.find((a) => a.jobId === jobId);
  return app ? app.status : null;
}

export async function applyToJob(jobId: string): Promise<{ created: boolean; status: ApplicationStatus }> {
  const apps = await readApplications();
  const existing = apps.find((a) => a.jobId === jobId);
  if (existing) {
    return { created: false, status: existing.status };
  }
  const newApp: Application = {
    jobId,
    status: "Applied",
    appliedAt: new Date().toISOString(),
  };
  const updated = [...apps, newApp];
  await writeApplications(updated);
  return { created: true, status: newApp.status };
}
