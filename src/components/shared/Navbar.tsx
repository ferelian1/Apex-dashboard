/**
 * Navbar — top navigation bar.
 *
 * Displays the app brand link, optional workspace name breadcrumb,
 * and the Clerk UserButton for account management / sign-out.
 *
 * Requirements: 1.4, 12.2
 */

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

interface NavbarProps {
  workspaceName?: string;
}

export default function Navbar({ workspaceName }: NavbarProps) {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="font-bold text-primary-600 text-lg">
          Apex
        </Link>
        {workspaceName && (
          <>
            <span className="text-gray-400">/</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {workspaceName}
            </span>
          </>
        )}
      </div>
      <UserButton fallbackRedirectUrl="/sign-in" />
    </header>
  );
}
