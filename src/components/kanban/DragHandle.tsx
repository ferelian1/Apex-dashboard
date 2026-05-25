/**
 * DragHandle — accessible drag handle icon for Kanban cards and columns.
 *
 * Renders a grip icon with proper aria-label and keyboard focus support.
 * Used inside TaskCard and ColumnCard as the drag activation target.
 *
 * Requirements: 12.2, 12.5
 */

import { forwardRef } from 'react';

interface DragHandleProps {
  'aria-label'?: string;
  className?: string;
}

const DragHandle = forwardRef<HTMLButtonElement, DragHandleProps>(
  function DragHandle(
    { 'aria-label': ariaLabel = 'Drag to reorder', className = '' },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        className={`cursor-grab active:cursor-grabbing touch-none rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 transition-colors ${className}`}
      >
        {/* Grip dots icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
    );
  },
);

export default DragHandle;
