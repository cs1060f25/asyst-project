/**
 * Utility functions for handling job deadlines
 * Used for filtering, sorting, and displaying deadline information
 */

export type DeadlineStatus = 'urgent' | 'soon' | 'normal' | 'expired' | 'none';
export type DeadlineFilter = 'urgent' | 'week' | 'month' | 'no_deadline' | 'all';

/**
 * Get the status of a deadline based on how soon it expires
 * @param deadline - ISO timestamp string or null
 * @returns Status indicating urgency level
 */
export function getDeadlineStatus(deadline: string | null): DeadlineStatus {
  if (!deadline) return 'none';
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  
  // Check if expired
  if (deadlineDate < now) return 'expired';
  
  // Calculate days until deadline
  const msUntilDeadline = deadlineDate.getTime() - now.getTime();
  const daysUntilDeadline = msUntilDeadline / (1000 * 60 * 60 * 24);
  
  if (daysUntilDeadline < 3) return 'urgent';
  if (daysUntilDeadline < 7) return 'soon';
  return 'normal';
}

/**
 * Get human-readable text for a deadline
 * @param deadline - ISO timestamp string or null
 * @returns Formatted deadline text
 */
export function getDeadlineText(deadline: string | null): string {
  if (!deadline) return 'No deadline';
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  
  // Check if expired
  if (deadlineDate < now) return 'Expired';
  
  // Calculate time until deadline
  const msUntilDeadline = deadlineDate.getTime() - now.getTime();
  const hoursUntilDeadline = msUntilDeadline / (1000 * 60 * 60);
  const daysUntilDeadline = Math.floor(hoursUntilDeadline / 24);
  
  // Due today
  if (daysUntilDeadline === 0) {
    const hours = Math.floor(hoursUntilDeadline);
    if (hours <= 1) return 'Due in 1 hour';
    if (hours < 24) return `Due in ${hours} hours`;
    return 'Due today';
  }
  
  // Due within days
  if (daysUntilDeadline === 1) return '1 day left';
  if (daysUntilDeadline < 7) return `${daysUntilDeadline} days left`;
  
  // Due in weeks
  const weeks = Math.floor(daysUntilDeadline / 7);
  if (weeks === 1) return '1 week left';
  if (weeks < 4) return `${weeks} weeks left`;
  
  // Due in months
  const months = Math.floor(daysUntilDeadline / 30);
  if (months === 1) return '1 month left';
  return `${months} months left`;
}

/**
 * Format a deadline date for display
 * @param deadline - ISO timestamp string
 * @returns Formatted date string (e.g., "Dec 15, 2024")
 */
export function formatDeadlineDate(deadline: string): string {
  const date = new Date(deadline);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Check if a deadline has expired
 * @param deadline - ISO timestamp string or null
 * @returns true if deadline has passed, false otherwise
 */
export function isDeadlineExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

/**
 * Filter jobs by deadline criteria
 * @param jobs - Array of jobs with deadline property
 * @param filter - Filter criteria
 * @returns Filtered array of jobs
 */
export function filterJobsByDeadline<T extends { deadline: string | null }>(
  jobs: T[],
  filter: DeadlineFilter
): T[] {
  const now = new Date();
  
  switch (filter) {
    case 'urgent':
      // Jobs with deadline < 3 days
      return jobs.filter(job => {
        if (!job.deadline) return false;
        const deadline = new Date(job.deadline);
        const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil >= 0 && daysUntil < 3;
      });
      
    case 'week':
      // Jobs with deadline < 7 days
      return jobs.filter(job => {
        if (!job.deadline) return false;
        const deadline = new Date(job.deadline);
        const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil >= 0 && daysUntil < 7;
      });
      
    case 'month':
      // Jobs with deadline < 30 days
      return jobs.filter(job => {
        if (!job.deadline) return false;
        const deadline = new Date(job.deadline);
        const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil >= 0 && daysUntil < 30;
      });
      
    case 'no_deadline':
      // Jobs with no deadline
      return jobs.filter(job => !job.deadline);
      
    case 'all':
    default:
      // All jobs (except expired by default)
      return jobs.filter(job => !isDeadlineExpired(job.deadline));
  }
}

/**
 * Sort jobs by deadline
 * @param jobs - Array of jobs with deadline property
 * @param order - 'asc' for earliest first, 'desc' for latest first
 * @returns Sorted array of jobs
 */
export function sortJobsByDeadline<T extends { deadline: string | null }>(
  jobs: T[],
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...jobs].sort((a, b) => {
    // Jobs with no deadline go to the end
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}
