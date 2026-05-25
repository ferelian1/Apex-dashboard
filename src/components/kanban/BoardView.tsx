'use client';

/**
 * BoardView — top-level Kanban board with full drag-and-drop context.
 *
 * - useOptimistic for immediate visual feedback within 100ms of drag start (Req 10.5)
 * - DndContext with closestCorners collision detection
 * - SortableContext for columns (horizontal strategy)
 * - handleDragOver: optimistic cross-column task move
 * - handleDragEnd: no-op detection, calls moveTask/moveColumn, reverts on failure
 * - DragOverlay: portal-rendered preview of active column or task
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */

import { useState, useOptimistic, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';

import { useBoardSensors, type ActiveDragItem } from '@/hooks/useDragAndDrop';
import { useRealtime } from '@/hooks/useRealtime';
import { moveTask } from '@/lib/actions/task';
import { moveColumn } from '@/lib/actions/column';
import ColumnCard from './ColumnCard';
import TaskCard from './TaskCard';
import CreateColumnForm from './CreateColumnForm';
import TaskDetailModal from './TaskDetailModal';
import ErrorNotification from '@/components/shared/ErrorNotification';
import type { BoardWithColumnsAndTasks, TaskWithDetails } from '@/types';
import { getTaskWithDetails } from '@/lib/db/task';

interface BoardViewProps {
  board: BoardWithColumnsAndTasks;
  workspaceId: string;
  currentUserId: string;
  isGuest: boolean;
}

export default function BoardView({
  board,
  workspaceId,
  currentUserId,
}: BoardViewProps) {
  const sensors = useBoardSensors();
  const [activeItem, setActiveItem] = useState<ActiveDragItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);

  // Optimistic board state — reverts automatically on Server Action failure
  const [optimisticBoard, setOptimisticBoard] = useOptimistic(
    board,
    (current: BoardWithColumnsAndTasks, action: OptimisticAction) =>
      applyOptimisticAction(current, action),
  );

  // Subscribe to Realtime updates for this board
  useRealtime(board.id);

  const columnIds = optimisticBoard.columns.map((c) => c.id);

  // ── Drag handlers ──────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type as 'task' | 'column' | undefined;
    if (type) setActiveItem({ id: String(event.active.id), type });
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Cross-column task move — apply optimistic update immediately (Req 10.5)
    if (activeType === 'task' && overType === 'column') {
      const sourceColumnId = active.data.current?.columnId as string;
      const destColumnId = String(over.id);
      if (sourceColumnId !== destColumnId) {
        setOptimisticBoard({
          type: 'MOVE_TASK_TO_COLUMN',
          taskId: String(active.id),
          sourceColumnId,
          destColumnId,
        });
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeType = active.data.current?.type as 'task' | 'column';
    const overId = String(over.id);
    const activeId = String(active.id);

    // No-op: same position (Req 10.7)
    if (activeId === overId) return;

    if (activeType === 'column') {
      const oldIndex = optimisticBoard.columns.findIndex((c) => c.id === activeId);
      const newIndex = optimisticBoard.columns.findIndex((c) => c.id === overId);
      if (oldIndex === newIndex) return;

      const result = await moveColumn({
        columnId: activeId,
        boardId: board.id,
        newPosition: newIndex,
      });

      if (!result.success) {
        setErrorMessage(result.error ?? 'Failed to move column');
      }
    } else if (activeType === 'task') {
      const sourceColumnId = active.data.current?.columnId as string;
      const overType = over.data.current?.type;
      const destColumnId =
        overType === 'column' ? overId : (over.data.current?.columnId as string);

      // Find new position index
      const destColumn = optimisticBoard.columns.find((c) => c.id === destColumnId);
      if (!destColumn) return;

      const overTaskIndex = destColumn.tasks.findIndex((t) => t.id === overId);
      const newPositionIndex = overTaskIndex >= 0 ? overTaskIndex : destColumn.tasks.length;
      const newPosition = (newPositionIndex + 1) * 1000;

      const result = await moveTask({
        taskId: activeId,
        sourceColumnId,
        destinationColumnId: destColumnId,
        newPosition,
      });

      if (!result.success) {
        setErrorMessage(result.error ?? 'Failed to move task');
      }
    }
  }

  // ── Task detail modal ──────────────────────────────────────────────────────

  const handleTaskClick = useCallback(
    async (taskId: string) => {
      setSelectedTaskId(taskId);
      const task = await getTaskWithDetails(taskId, currentUserId);
      setSelectedTask(task);
    },
    [currentUserId],
  );

  // ── Active drag overlay items ──────────────────────────────────────────────

  const activeColumn = activeItem?.type === 'column'
    ? optimisticBoard.columns.find((c) => c.id === activeItem.id)
    : null;

  const activeTask = activeItem?.type === 'task'
    ? optimisticBoard.columns
        .flatMap((c) => c.tasks)
        .find((t) => t.id === activeItem.id)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Board header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {board.name}
        </h1>
      </div>

      {/* Kanban columns — horizontally scrollable on all viewports (Req 10.1, 12.3) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* min-w-max ensures columns don't wrap on narrow viewports */}
          <div className="flex gap-4 p-4 min-h-full items-start min-w-max">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {optimisticBoard.columns.map((column) => (
                <ColumnCard
                  key={column.id}
                  column={column}
                  boardId={board.id}
                  workspaceId={workspaceId}
                  onTaskClick={handleTaskClick}
                />
              ))}
            </SortableContext>

            <CreateColumnForm boardId={board.id} />
          </div>

          {/* DragOverlay — portal-rendered drag preview (Req 10.8) */}
          {typeof document !== 'undefined' &&
            createPortal(
              <DragOverlay>
                {activeColumn && (
                  <ColumnCard
                    column={activeColumn}
                    boardId={board.id}
                    workspaceId={workspaceId}
                    isOverlay
                    onTaskClick={() => {}}
                  />
                )}
                {activeTask && (
                  <TaskCard
                    task={activeTask}
                    columnId=""
                    isOverlay
                    onClick={() => {}}
                  />
                )}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      </div>

      {/* Error notification — visible ≥ 3 seconds (Req 10.6) */}
      {errorMessage && (
        <ErrorNotification
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Task detail modal */}
      {selectedTaskId && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => {
            setSelectedTaskId(null);
            setSelectedTask(null);
          }}
          onDeleted={() => {
            setSelectedTaskId(null);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

// ── Optimistic action types ────────────────────────────────────────────────

type OptimisticAction =
  | { type: 'MOVE_TASK_TO_COLUMN'; taskId: string; sourceColumnId: string; destColumnId: string };

function applyOptimisticAction(
  board: BoardWithColumnsAndTasks,
  action: OptimisticAction,
): BoardWithColumnsAndTasks {
  if (action.type === 'MOVE_TASK_TO_COLUMN') {
    const { taskId, sourceColumnId, destColumnId } = action;
    if (sourceColumnId === destColumnId) return board;

    const sourceCol = board.columns.find((c) => c.id === sourceColumnId);
    const destCol = board.columns.find((c) => c.id === destColumnId);
    if (!sourceCol || !destCol) return board;

    const task = sourceCol.tasks.find((t) => t.id === taskId);
    if (!task) return board;

    return {
      ...board,
      columns: board.columns.map((col) => {
        if (col.id === sourceColumnId) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
        }
        if (col.id === destColumnId) {
          return { ...col, tasks: [...col.tasks, task] };
        }
        return col;
      }),
    };
  }
  return board;
}
