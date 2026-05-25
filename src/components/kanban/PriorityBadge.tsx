/**
 * PriorityBadge — color-coded badge for task priority levels.
 *
 * Priority color mapping (Requirement 12.5):
 * - LOW    → muted green
 * - MEDIUM → amber/yellow
 * - HIGH   → orange
 * - URGENT → red
 *
 * Requirements: 12.2, 12.5
 */

import type { Priority } from '@prisma/client';

interface PriorityBadgeProps {
  priority: Priority;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; className: string }
> = {
  LOW: {
    label: 'Low',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  },
  MEDIUM: {
    label: 'Medium',
    className:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  },
  HIGH: {
    label: 'High',
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
  URGENT: {
    label: 'Urgent',
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { label, className } = PRIORITY_CONFIG[priority];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
