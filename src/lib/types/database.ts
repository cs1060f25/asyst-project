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
