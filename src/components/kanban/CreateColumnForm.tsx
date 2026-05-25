'use client';

/**
 * CreateColumnForm — inline form for adding a new column to a board.
 *
 * Calls the createColumn Server Action on submit.
 *
 * Requirements: 11.1, 11.5, 11.6
 */

import { useState, useTransition, useRef } from 'react';
import { createColumn } from '@/lib/actions/column';

interface CreateColumnFormProps {
  boardId: string;
  onCreated?: () => void;
}

export default function CreateColumnForm({
  boardId,
  onCreated,
}: CreateColumnFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
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
    setName('');
    setFieldErrors({});
    setServerError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setServerError(null);

    startTransition(async () => {
      const result = await createColumn({ boardId, name });

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        } else {
          setServerError(result.error);
        }
        return;
      }

      setName('');
      setIsOpen(false);
      onCreated?.();
    });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="flex shrink-0 items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 transition-colors w-64"
      >
        <span className="text-lg leading-none">+</span>
        Add column
      </button>
    );
  }

  return (
    <div className="w-64 shrink-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Column name…"
            disabled={isPending}
            className={`w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition
              ${fieldErrors.name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.name[0]}</p>
          )}
        </div>

        {serverError && (
          <p className="text-xs text-red-500">{serverError}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="flex-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Adding…' : 'Add column'}
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
    </div>
  );
}
