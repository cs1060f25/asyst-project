import { promises as fs } from "fs";
import path from "path";

const DEFAULT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const PROFILE_PATH = path.join(DEFAULT_DATA_DIR, "profile.json");

export type ResumeInfo = {
  path: string; // absolute path on disk
  url: string; // public URL (from /public)
  originalName: string;
  size: number;
  mimeType: string;
  updatedAt: string;
};

export type Profile = {
  name: string;
  email: string;
  education: string;
  resume: ResumeInfo | null;
  offerDeadline: string | null; // ISO date string
};

export async function ensureDirs() {
  const uploadDir = getUploadDir();
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.mkdir(DEFAULT_DATA_DIR, { recursive: true });
}

export function getUploadDir() {
  return process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
}

export function getProfilePath() {
  return process.env.PROFILE_JSON || PROFILE_PATH;
}

export async function readProfile(): Promise<Profile> {
  try {
    const raw = await fs.readFile(getProfilePath(), "utf-8");
    const profile = JSON.parse(raw);
    // Ensure backward compatibility by adding missing fields
    return {
      name: profile.name || "",
      email: profile.email || "",
      education: profile.education || "",
      resume: profile.resume || null,
      offerDeadline: profile.offerDeadline || null,
    };
  } catch (e: any) {
    return { name: "", email: "", education: "", resume: null, offerDeadline: null };
  }
}

export async function writeProfile(profile: Profile) {
  await ensureDirs();
  await fs.writeFile(getProfilePath(), JSON.stringify(profile, null, 2), "utf-8");
}

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function isAllowedResumeType(mime: string) {
  return ALLOWED_MIME_TYPES.has(mime);
}

export function getPublicUrlForSavedFile(absPath: string): string {
  // Files saved under public/ are served from root ("/")
  const publicDir = path.join(process.cwd(), "public");
  const rel = path.relative(publicDir, absPath);
  return "/" + rel.split(path.sep).join("/");
}

export async function saveResumeFile(file: File): Promise<ResumeInfo> {
  await ensureDirs();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > MAX_RESUME_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  if (!isAllowedResumeType(file.type)) {
    throw new Error("INVALID_FILE_TYPE");
  }

  const uploadDir = getUploadDir();
  const unique = `${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
  const destination = path.join(uploadDir, unique);
  await fs.writeFile(destination, buffer);

  return {
    path: destination,
    url: getPublicUrlForSavedFile(destination),
    originalName: file.name,
    size: buffer.byteLength,
    mimeType: file.type,
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteResumeFileIfExists(info: ResumeInfo | null) {
  if (!info) return;
  try {
    await fs.unlink(info.path);
  } catch (_) {
    // ignore if already deleted
  }
}

export function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
