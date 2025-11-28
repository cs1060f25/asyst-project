// =============================================
// DATABASE TYPES
// Auto-generated from Supabase schema
// =============================================

// Job status enum
export type JobStatus = 'draft' | 'open' | 'closed';

// Application status enum
export type ApplicationStatus = 
  | 'applied' 
  | 'under_review' 
  | 'interview' 
  | 'offer' 
  | 'hired' 
  | 'rejected';

// =============================================
// TABLE: jobs
// =============================================
export interface Job {
  id: string;                  // UUID
  employer_id: string | null;  // UUID, links to auth.users
  title: string;
  company: string;
  description: string | null;
  location: string | null;
  salary_range: string | null;
  requirements: Record<string, unknown> | null;  // JSONB
  status: JobStatus;
  deadline: string | null;     // ISO timestamp
  created_at: string;          // ISO timestamp
  updated_at: string;          // ISO timestamp
}

// Type for inserting a new job (omits auto-generated fields)
export interface JobInsert {
  employer_id?: string | null;
  title: string;
  company: string;
  description?: string | null;
  location?: string | null;
  salary_range?: string | null;
  requirements?: Record<string, unknown> | null;
  status?: JobStatus;
  deadline?: string | null;
}

// Type for updating a job (all fields optional)
export interface JobUpdate {
  employer_id?: string | null;
  title?: string;
  company?: string;
  description?: string | null;
  location?: string | null;
  salary_range?: string | null;
  requirements?: Record<string, unknown> | null;
  status?: JobStatus;
  deadline?: string | null;
}

// =============================================
// TABLE: applications
// =============================================
export interface Application {
  id: string;                    // UUID
  job_id: string;                // UUID, foreign key
  candidate_id: string | null;   // UUID, links to auth.users
  status: ApplicationStatus;
  resume_url: string | null;
  cover_letter: string | null;
  supplemental_answers: Record<string, unknown> | null;  // JSONB
  applied_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}

// Type for inserting a new application (omits auto-generated fields)
export interface ApplicationInsert {
  job_id: string;
  candidate_id?: string | null;
  status?: ApplicationStatus;
  resume_url?: string | null;
  cover_letter?: string | null;
  supplemental_answers?: Record<string, unknown> | null;
}

// Type for updating an application (all fields optional)
export interface ApplicationUpdate {
  status?: ApplicationStatus;
  resume_url?: string | null;
  cover_letter?: string | null;
  supplemental_answers?: Record<string, unknown> | null;
}

// =============================================
// COMBINED TYPES (for joins)
// =============================================

// Application with job details
export interface ApplicationWithJob extends Application {
  job: Job;
}

// Job with application count
export interface JobWithApplicationCount extends Job {
  application_count: number;
}

// =============================================
// TABLE: candidate_profiles
// =============================================

// Work experience object structure
export interface WorkExperience {
  company: string;
  title: string;
  start_date: string; // YYYY-MM format
  end_date: string | null; // YYYY-MM format, null for current position
  description: string;
}

// Certification object structure
export interface Certification {
  name: string;
  issuer: string;
  date: string; // YYYY-MM format
  expiry: string | null; // YYYY-MM format, null if no expiry
}

// Main candidate profile interface
export interface CandidateProfile {
  id: string;                    // UUID
  user_id: string;               // UUID, links to auth.users
  name: string;                  // Required, title case normalized
  email: string;                 // Required, lowercase normalized
  phone: string | null;          // Optional, standardized format
  education: string | null;      // Optional
  major: string | null;          // Optional
  resume_url: string | null;    // Optional, URL to resume file
  skills: string[];             // Array of skills (lowercase, deduplicated)
  experience: string[];          // Array of strings
  certifications: string[];      // Array of strings
  linkedin_url: string | null;  // Optional, LinkedIn profile URL
  github_url: string | null;     // Optional, GitHub profile URL
  portfolio_url: string | null; // Optional, portfolio website URL
  website_url: string | null;   // Optional, Website URL
  twitter_url: string | null;   // Optional, Twitter URL
  mastodon_url: string | null;  // Optional, Mastodon URL
  dribbble_url: string | null;  // Optional, Dribbble URL
  leetcode_url: string | null;  // Optional, LeetCode URL
  codeforces_url: string | null; // Optional, Codeforces URL
  hackerrank_url: string | null; // Optional, HackerRank URL
  location: string | null;      // Optional
  timezone: string | null;      // Optional
  work_authorization: string | null; // Optional
  requires_sponsorship: boolean | null; // Optional
  open_to_relocation: boolean | null; // Optional
  employment_types: string[];   // Optional list
  pronouns: string | null;      // Optional
  offer_deadline: string | null; // Optional, date (YYYY-MM-DD)
  referral_source: string | null; // Optional
  eeo_gender: string | null;    // Optional
  eeo_race_ethnicity: string | null; // Optional
  eeo_veteran_status: string | null; // Optional
  eeo_disability_status: string | null; // Optional
  created_at: string;           // ISO timestamp
  updated_at: string;            // ISO timestamp
  // Resume metadata stored in DB
  resume_path: string | null;
  resume_original_name: string | null;
  resume_mime: string | null;
  resume_size: string | number | null; // bigint in DB -> string in JS, but some SDKs coerce to number
  resume_updated_at: string | null;
}

// Type for inserting a new candidate profile (omits auto-generated fields)
export interface CandidateProfileInsert {
  user_id: string;
  name: string;
  email: string;
  phone?: string | null;
  education?: string | null;
  major?: string | null;
  resume_url?: string | null;
  skills?: string[];
  experience?: string[];
  certifications?: string[];
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  website_url?: string | null;
  twitter_url?: string | null;
  mastodon_url?: string | null;
  dribbble_url?: string | null;
  leetcode_url?: string | null;
  codeforces_url?: string | null;
  hackerrank_url?: string | null;
  offer_deadline?: string | null;
  // Voluntary EEO disclosures
  eeo_gender?: string | null;
  eeo_race_ethnicity?: string | null;
  eeo_veteran_status?: string | null;
  eeo_disability_status?: string | null;
  // Common SWE profile fields
  location?: string | null;
  school?: string | null;
  degree_level?: string | null;
  graduation_date?: string | null; // YYYY-MM-DD
  gpa?: number | null;
  years_of_experience?: number | null;
  work_authorization?: string | null;
  requires_sponsorship?: boolean | null;
  open_to_relocation?: boolean | null;
  employment_types?: string[]; // e.g., ["internship","full_time"]
  pronouns?: string | null;
  languages?: string[];
  frameworks?: string[];
  timezone?: string | null;
  referral_source?: string | null;
}

// Type for updating a candidate profile (all fields optional except user_id)
export interface CandidateProfileUpdate {
  name?: string;
  email?: string;
  phone?: string | null;
  education?: string | null;
  major?: string | null;
  resume_url?: string | null;
  skills?: string[];
  experience?: WorkExperience[];
  certifications?: Certification[];
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  website_url?: string | null;
  twitter_url?: string | null;
  mastodon_url?: string | null;
  dribbble_url?: string | null;
  leetcode_url?: string | null;
  codeforces_url?: string | null;
  hackerrank_url?: string | null;
  offer_deadline?: string | null;
  // Voluntary EEO disclosures
  eeo_gender?: string | null;
  eeo_race_ethnicity?: string | null;
  eeo_veteran_status?: string | null;
  eeo_disability_status?: string | null;
  // Common SWE profile fields
  location?: string | null;
  school?: string | null;
  degree_level?: string | null;
  graduation_date?: string | null; // YYYY-MM-DD
  gpa?: number | null;
  years_of_experience?: number | null;
  work_authorization?: string | null;
  requires_sponsorship?: boolean | null;
  open_to_relocation?: boolean | null;
  employment_types?: string[];
  pronouns?: string | null;
  languages?: string[];
  frameworks?: string[];
  timezone?: string | null;
  referral_source?: string | null;
}

// =============================================
// TABLE: recruiter_profiles
// =============================================

// Company size enum
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

// Main recruiter profile interface
export interface RecruiterProfile {
  id: string;                    // UUID
  user_id: string;               // UUID, links to auth.users
  name: string;                  // Required
  email: string;                 // Required, lowercase normalized
  company_name: string;          // Required
  job_title: string;             // Required
  company_size: CompanySize | null; // Optional
  phone: string | null;          // Optional
  linkedin_url: string | null;   // Optional
  company_website: string | null; // Optional
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}

// Type for inserting a new recruiter profile (omits auto-generated fields)
export interface RecruiterProfileInsert {
  user_id: string;
  name: string;
  email: string;
  company_name: string;
  job_title: string;
  company_size?: CompanySize | null;
  phone?: string | null;
  linkedin_url?: string | null;
  company_website?: string | null;
}

// Type for updating a recruiter profile (all fields optional except user_id)
export interface RecruiterProfileUpdate {
  name?: string;
  email?: string;
  company_name?: string;
  job_title?: string;
  company_size?: CompanySize | null;
  phone?: string | null;
  linkedin_url?: string | null;
  company_website?: string | null;
}
