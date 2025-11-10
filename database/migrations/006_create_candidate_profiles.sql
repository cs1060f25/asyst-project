-- Migration: Create candidate_profiles table
-- This table stores profile information for candidates (job seekers)

CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    
    -- Education & Experience
    education TEXT,
    major TEXT,
    school TEXT,
    degree_level TEXT,
    graduation_date DATE,
    gpa NUMERIC(3, 2),
    
    -- Professional Information
    years_of_experience INTEGER,
    resume_url TEXT,
    
    -- Skills & Preferences
    skills TEXT[] DEFAULT '{}',
    experience TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    frameworks TEXT[] DEFAULT '{}',
    
    -- Social & Portfolio Links
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    website_url TEXT,
    twitter_url TEXT,
    mastodon_url TEXT,
    dribbble_url TEXT,
    leetcode_url TEXT,
    codeforces_url TEXT,
    hackerrank_url TEXT,
    
    -- Location & Timezone
    location TEXT,
    timezone TEXT,
    
    -- Work Authorization & Preferences
    work_authorization TEXT,
    requires_sponsorship BOOLEAN DEFAULT false,
    open_to_relocation BOOLEAN DEFAULT false,
    employment_types TEXT[] DEFAULT '{}',
    
    -- Personal Information
    pronouns TEXT,
    
    -- Recruitment & Application Info
    offer_deadline DATE,
    referral_source TEXT,
    
    -- EEO Information (Optional, for compliance)
    eeo_gender TEXT,
    eeo_race_ethnicity TEXT,
    eeo_veteran_status TEXT,
    eeo_disability_status TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(user_id);

-- Create index on email for searches
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_email ON candidate_profiles(email);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_candidate_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidate_profiles_updated_at
    BEFORE UPDATE ON candidate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_candidate_profiles_updated_at();

-- Temporarily disable RLS for development
ALTER TABLE candidate_profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON candidate_profiles TO authenticated;
GRANT ALL ON candidate_profiles TO anon;

COMMENT ON TABLE candidate_profiles IS 'Stores profile information for candidates (job seekers)';
