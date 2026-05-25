'use client';

/**
 * ColumnCard — sortable Kanban column with drag handle, task list, and create form.
 *
 * Uses useSortable from @dnd-kit/sortable for column reordering.
 * Renders a SortableContext for the tasks within the column.
 * Accepts isOverlay prop for DragOverlay rendering.
 *
 * Requirements: 10.1, 10.4, 10.8
 */

import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragHandle from './DragHandle';
import TaskCard from './TaskCard';
import CreateTaskForm from './CreateTaskForm';
import type { ColumnWithTasks } from '@/types';

interface ColumnCardProps {
  column: ColumnWithTasks;
  boardId: string;
  workspaceId: string;
  isOverlay?: boolean;
  onTaskClick: (taskId: string) => void;
}

export default function ColumnCard({
  column,
  boardId,
  workspaceId,
  isOverlay = false,
  onTaskClick,
}: ColumnCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col w-72 shrink-0 rounded-xl border bg-gray-50 dark:bg-gray-900/50 transition-shadow
        ${isDragging ? 'opacity-40 shadow-xl ring-2 ring-primary-400' : ''}
        ${isOverlay ? 'rotate-1 shadow-2xl ring-2 ring-primary-400' : ''}
        border-gray-200 dark:border-gray-700`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <DragHandle
          ref={setActivatorNodeRef}
          aria-label={`Drag column: ${column.name}`}
          {...attributes}
          {...listeners}
        />
        <h3 className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
          {column.name}
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          {column.tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-2 min-h-[2rem]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>
      </div>

      {/* Create task form */}
      <div className="px-3 pb-3 pt-1">
        <CreateTaskForm columnId={column.id} boardId={boardId} />
      </div>
    </div>
  );
}
