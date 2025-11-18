-- Migration: Ensure 'resumes' bucket exists and add storage policies for uploading PDFs per-user
-- This migration will:
-- 1) Create the 'resumes' bucket if it doesn't exist
-- 2) Add policies to allow authenticated users to manage files in their own folder: auth.uid()/...
-- 3) Optionally allow public read access to resumes (via SELECT). If you prefer private, remove the public-read policy and use signed URLs.

-- 1) Create bucket if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'resumes'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);
  END IF;
END $$;

-- 2) Policies for per-user folders under the 'resumes' bucket
-- Insert: allow authenticated users to upload to their own folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes-insert-own-folder'
  ) THEN
    CREATE POLICY "resumes-insert-own-folder"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'resumes'
      AND name LIKE auth.uid()::text || '/%'
    );
  END IF;
END $$;

-- Update: allow authenticated users to update files in their own folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes-update-own-folder'
  ) THEN
    CREATE POLICY "resumes-update-own-folder"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'resumes'
      AND name LIKE auth.uid()::text || '/%'
    );
  END IF;
END $$;

-- Delete: allow authenticated users to delete files in their own folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes-delete-own-folder'
  ) THEN
    CREATE POLICY "resumes-delete-own-folder"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'resumes'
      AND name LIKE auth.uid()::text || '/%'
    );
  END IF;
END $$;

-- 3) Public read (optional). If you prefer private resumes, remove this and use signed URLs in the app.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes-public-read'
  ) THEN
    CREATE POLICY "resumes-public-read"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (
      bucket_id = 'resumes'
    );
  END IF;
END $$;
