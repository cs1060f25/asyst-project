-- =============================================
-- Migration: Add composite index for jobs
-- Date: 2025-10-27
-- Issue: ASYST-16 - Missing composite index for recruiter queries
-- =============================================

-- Problem: Queries filtering by employer_id AND status are slow
-- Common query: "Show all open jobs I posted"
-- Example: SELECT * FROM jobs WHERE employer_id = '...' AND status = 'open'

-- Add composite index on (employer_id, status)
-- This allows PostgreSQL to efficiently filter recruiter's jobs by status
CREATE INDEX IF NOT EXISTS idx_jobs_employer_status 
ON jobs(employer_id, status);

-- Performance Impact:
-- Before: O(n) where n = all jobs by employer (must scan all to filter by status)
-- After: O(log n) + O(k) where k = matching rows (direct index lookup)

-- Example queries that benefit:
-- 1. Recruiter dashboard: "Show all my open job postings"
-- 2. Job management: "List all my draft jobs"
-- 3. Analytics: "Count closed jobs by employer"

-- Verify index was created:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'jobs' AND indexname = 'idx_jobs_employer_status';

-- Check query plan uses the index:
-- EXPLAIN ANALYZE SELECT * FROM jobs WHERE employer_id = 'some-uuid' AND status = 'open';
-- Should show: "Index Scan using idx_jobs_employer_status"
