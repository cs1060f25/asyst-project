-- =============================================
-- Migration: Extend candidate_profiles with disclosures & SWE fields
-- Date: 2025-11-04
-- =============================================

-- Voluntary EEO disclosure fields (all optional)
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS eeo_gender TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS eeo_race_ethnicity TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS eeo_veteran_status TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS eeo_disability_status TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS eeo_prefer_not_to_say BOOLEAN NULL;

-- Common SWE application/profile fields
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS location TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS school TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS degree_level TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS graduation_date TEXT NULL; -- YYYY-MM
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS gpa NUMERIC NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS years_experience INTEGER NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS work_authorization TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS requires_sponsorship BOOLEAN NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS open_to_relocation BOOLEAN NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS employment_types TEXT[] DEFAULT '{}'; -- e.g., {"internship","full_time"}
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS pronouns TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS frameworks TEXT[] DEFAULT '{}';
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS timezone TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS website_url TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS mastodon_url TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS dribbble_url TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS leetcode_url TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS codeforces_url TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS hackerrank_url TEXT NULL;
ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS referral_source TEXT NULL;

-- Indexes for array fields
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_employment_types
ON candidate_profiles USING GIN (employment_types);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_languages
ON candidate_profiles USING GIN (languages);

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_frameworks
ON candidate_profiles USING GIN (frameworks);

COMMENT ON COLUMN candidate_profiles.eeo_gender IS 'Voluntary EEO gender (optional)';
COMMENT ON COLUMN candidate_profiles.eeo_race_ethnicity IS 'Voluntary EEO race/ethnicity (optional)';
COMMENT ON COLUMN candidate_profiles.eeo_veteran_status IS 'Voluntary EEO veteran status (optional)';
COMMENT ON COLUMN candidate_profiles.eeo_disability_status IS 'Voluntary EEO disability status (optional)';
COMMENT ON COLUMN candidate_profiles.eeo_prefer_not_to_say IS 'Voluntary EEO prefer not to say flag';
