-- =============================================
-- Migration: Create candidate_profiles table
-- Date: 2025-01-27
-- Issue: ASYST-32 - Candidate Profile DB schema
-- =============================================

-- Purpose: Create comprehensive candidate profile schema aligned with architecture
-- This table stores normalized candidate data that integrates with:
-- - Data Standardization & Validation Service (for normalization)
-- - Candidate Portal (for profile management)
-- - Downstream services (for job matching, applications)

-- Create candidate_profiles table
CREATE TABLE IF NOT EXISTS candidate_profiles (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic contact information
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NULL, -- Normalized phone format (e.g., "+1-XXX-XXX-XXXX")
    
    -- Professional information
    education TEXT NULL,
    resume_url TEXT NULL, -- URL to resume file (PDF, DOC, DOCX)
    
    -- Skills and competencies
    skills TEXT[] DEFAULT '{}', -- Array of skill strings (normalized, lowercase)
    
    -- Work experience (structured data)
    experience JSONB DEFAULT '[]', -- Array of experience objects:
    --   [{ "company": "string", "title": "string", "start_date": "YYYY-MM", "end_date": "YYYY-MM" | null, "description": "string" }]
    
    -- Certifications and credentials
    certifications JSONB DEFAULT '[]', -- Array of certification objects:
    --   [{ "name": "string", "issuer": "string", "date": "YYYY-MM", "expiry": "YYYY-MM" | null }]
    
    -- Professional links
    linkedin_url TEXT NULL, -- LinkedIn profile URL
    github_url TEXT NULL,    -- GitHub profile URL
    portfolio_url TEXT NULL, -- Personal portfolio website URL
    
    -- Application timeline
    offer_deadline TIMESTAMPTZ NULL, -- When candidate needs to respond to offers
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common query patterns
-- Index for user lookups (most common)
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id 
ON candidate_profiles(user_id);

-- Index for email lookups (for duplicate prevention)
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_email 
ON candidate_profiles(email);

-- Index for skills search (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_skills 
ON candidate_profiles USING GIN(skills);

-- Index for experience search (GIN index for JSONB operations)
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_experience 
ON candidate_profiles USING GIN(experience);

-- Index for offer deadline queries (for recruiter prioritization)
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_offer_deadline 
ON candidate_profiles(offer_deadline) WHERE offer_deadline IS NOT NULL;

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_candidate_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_candidate_profiles_updated_at
    BEFORE UPDATE ON candidate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_candidate_profiles_updated_at();

-- Add comments for documentation
COMMENT ON TABLE candidate_profiles IS 'Stores comprehensive candidate profile data with normalized fields for integration with Data Standardization & Validation Service';
COMMENT ON COLUMN candidate_profiles.user_id IS 'Links to auth.users table for authentication integration';
COMMENT ON COLUMN candidate_profiles.name IS 'Full name in title case format (normalized)';
COMMENT ON COLUMN candidate_profiles.email IS 'Email address in lowercase format (normalized)';
COMMENT ON COLUMN candidate_profiles.phone IS 'Phone number in standardized format (normalized)';
COMMENT ON COLUMN candidate_profiles.skills IS 'Array of skills in lowercase format (normalized and deduplicated)';
COMMENT ON COLUMN candidate_profiles.experience IS 'Structured work experience data as JSONB array';
COMMENT ON COLUMN candidate_profiles.certifications IS 'Structured certification data as JSONB array';
COMMENT ON COLUMN candidate_profiles.offer_deadline IS 'Deadline for responding to job offers (used for recruiter prioritization)';

-- Example queries that will benefit from these indexes:
-- 1. Get profile by user: SELECT * FROM candidate_profiles WHERE user_id = 'uuid';
-- 2. Check email uniqueness: SELECT COUNT(*) FROM candidate_profiles WHERE email = 'email';
-- 3. Search by skills: SELECT * FROM candidate_profiles WHERE 'javascript' = ANY(skills);
-- 4. Find candidates with urgent deadlines: SELECT * FROM candidate_profiles WHERE offer_deadline < NOW() + INTERVAL '7 days';
-- 5. Search experience: SELECT * FROM candidate_profiles WHERE experience @> '[{"company": "Google"}]';

-- Verify table creation:
-- SELECT table_name, column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'candidate_profiles' 
-- ORDER BY ordinal_position;
