/**
 * LoadingSkeleton — generic skeleton loader for board, column, and task states.
 *
 * Uses Tailwind's animate-pulse to indicate loading. Variants:
 * - board: 3 column skeletons side by side (full board loading state)
 * - column: column header + 3 task card skeletons
 * - task: single task card skeleton
 * - generic: simple rectangle skeleton
 *
 * Requirements: 10.6, 11.6, 12.6
 */

interface LoadingSkeletonProps {
  variant?: 'board' | 'column' | 'task' | 'generic';
  count?: number;
}

function TaskSkeleton() {
  return (
    <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 space-y-2 animate-pulse">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="flex items-center justify-between mt-2">
        <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="w-72 shrink-0 rounded-xl bg-gray-50 dark:bg-gray-900 p-3 space-y-3 animate-pulse">
      {/* Column header */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      {/* Task skeletons */}
      <TaskSkeleton />
      <TaskSkeleton />
      <TaskSkeleton />
    </div>
  );
}

export default function LoadingSkeleton({
  variant = 'generic',
  count = 1,
}: LoadingSkeletonProps) {
  if (variant === 'board') {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        <ColumnSkeleton />
        <ColumnSkeleton />
        <ColumnSkeleton />
      </div>
    );
  }

  if (variant === 'column') {
    return <ColumnSkeleton />;
  }

  if (variant === 'task') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    );
  }

  // generic
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      ))}
    </div>
  );
}

/**
 * Named export for use as the `loading` prop in dynamic imports.
 *
 * @example
 * const BoardView = dynamic(() => import('@/components/kanban/BoardView'), {
 *   ssr: false,
 *   loading: () => <BoardSkeleton />,
 * });
 */
export function BoardSkeleton() {
  return <LoadingSkeleton variant="board" />;
}
