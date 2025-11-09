import { promises as fs } from "fs";
import path from "path";
import { Job } from "./applications";

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const DEFAULT_JOBS_PATH = path.join(DEFAULT_DATA_DIR, "jobs.json");

function getJobsPath() {
  return process.env.JOBS_JSON || DEFAULT_JOBS_PATH;
}

export async function ensureDataDir() {
  await fs.mkdir(DEFAULT_DATA_DIR, { recursive: true });
}

// Initial jobs data
const INITIAL_JOBS: Job[] = [
  { id: "job-1", title: "Frontend Engineer", company: "Acme Corp", location: "Remote" },
  { id: "job-2", title: "Backend Engineer", company: "Globex", location: "New York, NY" },
  { id: "job-3", title: "Fullstack Developer", company: "Initech", location: "San Francisco, CA" },
];

export async function readJobs(): Promise<Job[]> {
  try {
    const raw = await fs.readFile(getJobsPath(), "utf-8");
    return JSON.parse(raw);
  } catch {
    // If file doesn't exist, create it with initial data
    await writeJobs(INITIAL_JOBS);
    return INITIAL_JOBS;
  }
}

export async function writeJobs(jobs: Job[]) {
  await ensureDataDir();
  await fs.writeFile(getJobsPath(), JSON.stringify(jobs, null, 2), "utf-8");
}

export async function createJob(jobData: Omit<Job, "id">): Promise<Job> {
  const jobs = await readJobs();
  const newJob: Job = {
    id: `job-${Date.now()}`,
    ...jobData,
  };
  const updatedJobs = [...jobs, newJob];
  await writeJobs(updatedJobs);
  return newJob;
}

export async function getJobById(id: string): Promise<Job | null> {
  const jobs = await readJobs();
  return jobs.find(job => job.id === id) || null;
}

export async function updateJob(id: string, updates: Partial<Omit<Job, "id">>): Promise<Job | null> {
  const jobs = await readJobs();
  const jobIndex = jobs.findIndex(job => job.id === id);
  
  if (jobIndex === -1) {
    return null;
  }
  
  jobs[jobIndex] = { ...jobs[jobIndex], ...updates };
  await writeJobs(jobs);
  return jobs[jobIndex];
}

export async function deleteJob(id: string): Promise<boolean> {
  const jobs = await readJobs();
  const filteredJobs = jobs.filter(job => job.id !== id);
  
  if (filteredJobs.length === jobs.length) {
    return false; // Job not found
  }
  
  await writeJobs(filteredJobs);
  return true;
}
