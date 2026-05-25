'use client';

/**
 * GuestLoginButton — client component that invokes the guestLogin Server
 * Action and surfaces any error to the user.
 *
 * Requirements: 8.1, 8.2, 8.5
 */

import { useState, useTransition } from 'react';
import { guestLogin } from '@/lib/actions/auth';

export default function GuestLoginButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await guestLogin();
      if (result?.error) {
        setError(result.error);
      }
      // On success guestLogin() redirects server-side; nothing to do here.
    });
  }

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-60 transition-colors"
        aria-busy={isPending}
      >
        {isPending ? 'Signing in…' : 'Log In as Recruiter Guest'}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
