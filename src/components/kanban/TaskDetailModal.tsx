'use client';

/**
 * TaskDetailModal — dialog for viewing and editing a task's full details.
 *
 * Displays title, description, priority, assignee, due date, labels, and comments.
 * Inline editing for each field; on explicit save calls updateTask Server Action.
 * Delete button calls deleteTask with confirmation; cascade deletes comments.
 * Reflects changes within 500ms of server response (Req 11.3).
 *
 * Requirements: 11.2, 11.3, 11.4
 */

import { useState, useTransition } from 'react';
import { updateTask, deleteTask } from '@/lib/actions/task';
import PriorityBadge from './PriorityBadge';
import type { TaskWithDetails } from '@/types';
import type { Priority } from '@prisma/client';

interface TaskDetailModalProps {
  task: TaskWithDetails;
  onClose: () => void;
  onDeleted?: () => void;
}

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TaskDetailModal({
  task,
  onClose,
  onDeleted,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      const result = await updateTask(task.id, { title, description, priority });
      if (!result.success) {
        setSaveError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteTask(task.id);
      if (!result.success) {
        setDeleteError(result.error);
        setConfirmDelete(false);
      } else {
        onDeleted?.();
        onClose();
      }
    });
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Task: ${task.title}`}
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 text-lg font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Priority
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-full transition-opacity ${priority === p ? 'opacity-100 ring-2 ring-offset-1 ring-primary-500' : 'opacity-60 hover:opacity-80'}`}
                >
                  <PriorityBadge priority={p} />
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description…"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition"
            />
          </div>

          {/* Assignee (read-only display) */}
          {task.assignee && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Assignee
              </label>
              <div className="flex items-center gap-2">
                {task.assignee.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={task.assignee.image} alt={task.assignee.name ?? ''} className="h-6 w-6 rounded-full" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-xs font-medium text-primary-700">
                    {(task.assignee.name ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">{task.assignee.name}</span>
              </div>
            </div>
          )}

          {/* Due date (read-only display) */}
          {task.dueDate && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Due date
              </label>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {new Date(task.dueDate).toLocaleDateString(undefined, {
                  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Labels */}
          {task.labels.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Labels
              </label>
              <div className="flex flex-wrap gap-1">
                {task.labels.map((label) => (
                  <span key={label} className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {task.comments.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Comments ({task.comments.length})
              </label>
              <div className="space-y-3">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-xs font-medium text-primary-700">
                      {(comment.user.name ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{comment.user.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          {/* Delete */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50
                ${confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
            >
              {isDeleting ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete task'}
            </button>
            {confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            )}
            {deleteError && <p className="text-xs text-red-500">{deleteError}</p>}
          </div>

          {/* Save */}
          <div className="flex items-center gap-2">
            {saveError && <p className="text-xs text-red-500">{saveError}</p>}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
