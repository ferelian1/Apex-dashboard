'use client';

/**
 * TaskCard — draggable task card for the Kanban board.
 *
 * Uses useSortable from @dnd-kit/sortable for drag-and-drop.
 * Displays title, PriorityBadge, assignee avatar, due date, and label count.
 * Accepts isOverlay prop for DragOverlay rendering (disables sortable transform).
 *
 * Requirements: 10.1, 10.5, 10.8
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PriorityBadge from './PriorityBadge';
import DragHandle from './DragHandle';
import type { TaskWithAssignee } from '@/types';

interface TaskCardProps {
  task: TaskWithAssignee;
  columnId: string;
  isOverlay?: boolean;
  onClick: (taskId: string) => void;
}

export default function TaskCard({
  task,
  columnId,
  isOverlay = false,
  onClick,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task, columnId },
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white dark:bg-gray-900 p-3 shadow-sm transition-shadow
        ${isDragging ? 'opacity-40 shadow-lg ring-2 ring-primary-400' : 'hover:shadow-md'}
        ${isOverlay ? 'rotate-2 shadow-xl ring-2 ring-primary-400' : ''}
        border-gray-200 dark:border-gray-700`}
    >
      {/* Drag handle */}
      <DragHandle
        ref={setActivatorNodeRef}
        aria-label={`Drag task: ${task.title}`}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      />

      {/* Clickable content area */}
      <button
        type="button"
        onClick={() => onClick(task.id)}
        className="w-full text-left"
      >
        {/* Title */}
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 pr-6 line-clamp-2">
          {task.title}
        </p>

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={task.priority} />

          {task.labels.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {task.labels.length} label{task.labels.length !== 1 ? 's' : ''}
            </span>
          )}

          {task.dueDate && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
              {new Date(task.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {task.assignee && (
          <div className="mt-2 flex items-center gap-1.5">
            {task.assignee.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={task.assignee.image}
                alt={task.assignee.name ?? 'Assignee'}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-xs font-medium text-primary-700 dark:text-primary-300">
                {(task.assignee.name ?? '?')[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
              {task.assignee.name}
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
