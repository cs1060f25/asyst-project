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
  requirements: Record<string, any> | null;  // JSONB
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
  requirements?: Record<string, any> | null;
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
  requirements?: Record<string, any> | null;
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
  supplemental_answers: Record<string, any> | null;  // JSONB
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
  supplemental_answers?: Record<string, any> | null;
}

// Type for updating an application (all fields optional)
export interface ApplicationUpdate {
  status?: ApplicationStatus;
  resume_url?: string | null;
  cover_letter?: string | null;
  supplemental_answers?: Record<string, any> | null;
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
  resume_url: string | null;    // Optional, URL to resume file
  skills: string[];             // Array of skills (lowercase, deduplicated)
  experience: WorkExperience[];  // Array of work experience objects
  certifications: Certification[]; // Array of certification objects
  linkedin_url: string | null;  // Optional, LinkedIn profile URL
  github_url: string | null;     // Optional, GitHub profile URL
  portfolio_url: string | null; // Optional, portfolio website URL
  offer_deadline: string | null; // Optional, ISO timestamp
  created_at: string;           // ISO timestamp
  updated_at: string;            // ISO timestamp
}

// Type for inserting a new candidate profile (omits auto-generated fields)
export interface CandidateProfileInsert {
  user_id: string;
  name: string;
  email: string;
  phone?: string | null;
  education?: string | null;
  resume_url?: string | null;
  skills?: string[];
  experience?: WorkExperience[];
  certifications?: Certification[];
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  offer_deadline?: string | null;
  // Voluntary EEO disclosures
  eeo_gender?: string | null;
  eeo_race_ethnicity?: string | null;
  eeo_veteran_status?: string | null;
  eeo_disability_status?: string | null;
  eeo_prefer_not_to_say?: boolean | null;
  // Common SWE profile fields
  location?: string | null;
  school?: string | null;
  degree_level?: string | null;
  graduation_date?: string | null; // YYYY-MM
  gpa?: number | null;
  years_experience?: number | null;
  work_authorization?: string | null;
  requires_sponsorship?: boolean | null;
  open_to_relocation?: boolean | null;
  employment_types?: string[]; // e.g., ["internship","full_time"]
  pronouns?: string | null;
  languages?: string[];
  frameworks?: string[];
  timezone?: string | null;
  website_url?: string | null;
  twitter_url?: string | null;
  mastodon_url?: string | null;
  dribbble_url?: string | null;
  leetcode_url?: string | null;
  codeforces_url?: string | null;
  hackerrank_url?: string | null;
  referral_source?: string | null;
}

// Type for updating a candidate profile (all fields optional except user_id)
export interface CandidateProfileUpdate {
  name?: string;
  email?: string;
  phone?: string | null;
  education?: string | null;
  resume_url?: string | null;
  skills?: string[];
  experience?: WorkExperience[];
  certifications?: Certification[];
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  offer_deadline?: string | null;
  // Voluntary EEO disclosures
  eeo_gender?: string | null;
  eeo_race_ethnicity?: string | null;
  eeo_veteran_status?: string | null;
  eeo_disability_status?: string | null;
  eeo_prefer_not_to_say?: boolean | null;
  // Common SWE profile fields
  location?: string | null;
  school?: string | null;
  degree_level?: string | null;
  graduation_date?: string | null; // YYYY-MM
  gpa?: number | null;
  years_experience?: number | null;
  work_authorization?: string | null;
  requires_sponsorship?: boolean | null;
  open_to_relocation?: boolean | null;
  employment_types?: string[];
  pronouns?: string | null;
  languages?: string[];
  frameworks?: string[];
  timezone?: string | null;
  website_url?: string | null;
  twitter_url?: string | null;
  mastodon_url?: string | null;
  dribbble_url?: string | null;
  leetcode_url?: string | null;
  codeforces_url?: string | null;
  hackerrank_url?: string | null;
  referral_source?: string | null;
}
