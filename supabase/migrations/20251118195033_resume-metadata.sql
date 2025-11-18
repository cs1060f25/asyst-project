-- Migration: Add resume metadata columns to candidate_profiles for storage-based resumes
-- Recommended approach: store file in Supabase Storage and persist path + metadata in DB

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'resume_path'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN resume_path TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'resume_original_name'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN resume_original_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'resume_mime'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN resume_mime TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'resume_size'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN resume_size BIGINT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'resume_updated_at'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN resume_updated_at TIMESTAMPTZ;
  END IF;
END $$;

-- Optional helpful indexes
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_resume_path ON candidate_profiles(resume_path);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_resume_updated_at ON candidate_profiles(resume_updated_at);
