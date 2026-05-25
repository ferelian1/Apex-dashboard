'use client';

/**
 * CreateTaskForm — inline form for creating a new task in a column.
 *
 * Calls the createTask Server Action on submit. Displays per-field validation
 * errors inline without dismissing the form. Preserves input on non-validation
 * errors.
 *
 * Requirements: 11.1, 11.5, 11.6
 */

import { useState, useTransition, useRef } from 'react';
import { createTask } from '@/lib/actions/task';

interface CreateTaskFormProps {
  columnId: string;
  boardId: string;
  onCreated?: () => void;
}

export default function CreateTaskForm({
  columnId,
  boardId,
  onCreated,
}: CreateTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleCancel() {
    setIsOpen(false);
    setTitle('');
    setFieldErrors({});
    setServerError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setServerError(null);

    startTransition(async () => {
      const result = await createTask({ columnId, boardId, title });

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          // Keep form open with input preserved (Req 11.5)
        } else {
          // Non-validation error — preserve input (Req 11.6)
          setServerError(result.error);
        }
        return;
      }

      // Success — reset and close
      setTitle('');
      setIsOpen(false);
      onCreated?.();
    });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Add a task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title…"
          disabled={isPending}
          className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition
            ${fieldErrors.title ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
        />
        {fieldErrors.title && (
          <p className="mt-1 text-xs text-red-500">{fieldErrors.title[0]}</p>
        )}
      </div>

      {serverError && (
        <p className="text-xs text-red-500">{serverError}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="flex-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Adding…' : 'Add task'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
