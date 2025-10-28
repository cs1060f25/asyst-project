-- =============================================
-- Migration: Add composite index for applications
-- Date: 2025-10-27
-- Issue: ASYST-16 - Missing composite index causes slow queries
-- =============================================

-- Problem: Queries filtering by job_id AND status are slow
-- Common query: "Show all applications for a job with specific status"
-- Example: SELECT * FROM applications WHERE job_id = '...' AND status = 'under_review'

-- Add composite index on (job_id, status)
-- This allows PostgreSQL to efficiently filter by both columns in a single index lookup
CREATE INDEX IF NOT EXISTS idx_applications_job_status 
ON applications(job_id, status);

-- Performance Impact:
-- Before: O(n) where n = applications for that job (must scan all to filter by status)
-- After: O(log n) + O(k) where k = matching rows (direct index lookup)

-- Example queries that benefit:
-- 1. Recruiter dashboard: "Show all 'under_review' applications for my job postings"
-- 2. Job detail page: "Count of applications by status for this job"
-- 3. Status filtering: "Show all 'interview' stage applications for job X"

-- Verify index was created:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'applications' AND indexname = 'idx_applications_job_status';

-- Check query plan uses the index:
-- EXPLAIN ANALYZE SELECT * FROM applications WHERE job_id = 'some-uuid' AND status = 'under_review';
-- Should show: "Index Scan using idx_applications_job_status"
