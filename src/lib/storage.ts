import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import type { 
  CandidateProfile, 
  CandidateProfileInsert, 
  CandidateProfileUpdate 
} from "@/lib/types/database";

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
  } catch (error) {
    console.error('Error reading profile:', error);
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
  } catch {
    // ignore if already deleted
  }
}

export function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// =============================================
// CANDIDATE PROFILE DATABASE OPERATIONS
// =============================================

/**
 * Get candidate profile by user ID from Supabase
 * @param userId - The user ID to look up
 * @returns Promise<CandidateProfile | null>
 */
export async function getCandidateProfile(userId: string): Promise<CandidateProfile | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data as CandidateProfile;
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    throw error;
  }
}

/**
 * Create a new candidate profile in Supabase
 * @param profile - The profile data to insert
 * @returns Promise<CandidateProfile>
 */
export async function createCandidateProfile(profile: CandidateProfileInsert): Promise<CandidateProfile> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('candidate_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as CandidateProfile;
  } catch (error) {
    console.error('Error creating candidate profile:', error);
    throw error;
  }
}

/**
 * Update an existing candidate profile in Supabase
 * @param userId - The user ID to update
 * @param updates - The fields to update
 * @returns Promise<CandidateProfile>
 */
export async function updateCandidateProfile(
  userId: string, 
  updates: CandidateProfileUpdate
): Promise<CandidateProfile> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('candidate_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as CandidateProfile;
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    throw error;
  }
}

/**
 * Delete a candidate profile from Supabase
 * @param userId - The user ID to delete
 * @returns Promise<void>
 */
export async function deleteCandidateProfile(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('candidate_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting candidate profile:', error);
    throw error;
  }
}
