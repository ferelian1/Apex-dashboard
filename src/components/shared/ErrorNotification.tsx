'use client';

/**
 * ErrorNotification — toast error notification.
 *
 * Renders a dismissible red toast at the bottom-right of the viewport.
 * Auto-dismisses after `duration` ms (minimum 3000 ms per requirement 10.6).
 * Includes an accessible close button for manual dismissal.
 *
 * Requirements: 10.6, 11.6, 12.6
 */

import { useEffect, useState } from 'react';

interface ErrorNotificationProps {
  message: string;
  onDismiss?: () => void;
  /** Auto-dismiss delay in ms. Minimum enforced at 3000 ms. */
  duration?: number;
}

export default function ErrorNotification({
  message,
  onDismiss,
  duration = 3000,
}: ErrorNotificationProps) {
  const [visible, setVisible] = useState(true);

  // Enforce minimum 3-second visibility (Requirement 10.6)
  const effectiveDuration = Math.max(duration, 3000);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, effectiveDuration);

    return () => clearTimeout(timer);
  }, [effectiveDuration, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg max-w-sm animate-in slide-in-from-bottom-2 duration-300"
    >
      {/* Error icon */}
      <svg
        className="mt-0.5 h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>

      {/* Message */}
      <p className="flex-1 text-sm font-medium">{message}</p>

      {/* Close button */}
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="shrink-0 rounded p-0.5 hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors"
        aria-label="Dismiss error"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
