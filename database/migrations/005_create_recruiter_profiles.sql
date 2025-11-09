-- Create recruiter_profiles table for HW9 role-based authentication
-- This table stores profile information for users with the 'recruiter' role

CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  phone TEXT,
  linkedin_url TEXT,
  company_website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id ON recruiter_profiles(user_id);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_email ON recruiter_profiles(email);

-- Add RLS (Row Level Security) policies
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own recruiter profile"
  ON recruiter_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own recruiter profile"
  ON recruiter_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own recruiter profile"
  ON recruiter_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recruiter_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_recruiter_profiles_timestamp
  BEFORE UPDATE ON recruiter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_recruiter_profiles_updated_at();

-- Add comment for documentation
COMMENT ON TABLE recruiter_profiles IS 'Stores profile information for recruiter users';
COMMENT ON COLUMN recruiter_profiles.company_size IS 'Company size categories: startup (1-10), small (11-50), medium (51-200), large (201-1000), enterprise (1000+)';
