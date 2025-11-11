import { getDeadlineStatus, getDeadlineText, formatDeadlineDate } from "@/lib/utils/dateUtils";

export interface DeadlineBadgeProps {
  deadline: string | null;
  variant?: 'full' | 'compact';
}

/**
 * DeadlineBadge component displays deadline information with urgency indicators
 * - Urgent (< 3 days): Red badge
 * - Soon (3-7 days): Yellow badge
 * - Normal (> 7 days): Gray badge
 * - Expired: Gray strikethrough
 * - No deadline: Subtle gray text
 */
export function DeadlineBadge({ deadline, variant = 'full' }: DeadlineBadgeProps) {
  const status = getDeadlineStatus(deadline);
  const text = getDeadlineText(deadline);

  // No deadline
  if (status === 'none') {
    return (
      <span
        className="text-xs text-gray-500"
        aria-label="No application deadline"
      >
        {variant === 'compact' ? '∞' : 'No deadline'}
      </span>
    );
  }

  // Expired deadline
  if (status === 'expired') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 line-through"
        aria-label="Application deadline has passed"
      >
        {variant === 'compact' ? '⊘' : 'Expired'}
      </span>
    );
  }

  // Urgent deadline (< 3 days)
  if (status === 'urgent') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200"
        aria-label={`Urgent: ${text}`}
        role="status"
      >
        <span className="text-red-600">🔴</span>
        {variant === 'full' && <span>URGENT</span>}
        <span className="font-semibold">{text}</span>
      </span>
    );
  }

  // Soon deadline (3-7 days)
  if (status === 'soon') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-900 border border-yellow-200"
        aria-label={`Deadline soon: ${text}`}
        role="status"
      >
        <span className="text-yellow-600">🟡</span>
        {variant === 'full' && <span>SOON</span>}
        <span>{text}</span>
      </span>
    );
  }

  // Normal deadline (> 7 days)
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
      aria-label={`Application deadline: ${deadline ? formatDeadlineDate(deadline) : ''}`}
    >
      <span>⏰</span>
      {variant === 'compact' ? (
        <span>{text}</span>
      ) : (
        <span>Due {deadline ? formatDeadlineDate(deadline) : ''}</span>
      )}
    </span>
  );
}
