/**
 * Sign-in page — renders the standard Clerk <SignIn /> component followed by
 * a visible divider and the "Log In as Recruiter Guest" button.
 *
 * Requirements: 8.1, 9.1, 9.2
 */

import { SignIn } from '@clerk/nextjs';
import GuestLoginButton from './GuestLoginButton';

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="flex flex-col items-center gap-6 w-full max-w-md">
        {/* Standard Clerk sign-in form */}
        <SignIn />

        {/* Visible divider — Requirement 8.1 */}
        <div className="flex w-full items-center gap-3">
          <hr className="flex-1 border-gray-300 dark:border-gray-700" />
          <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
          <hr className="flex-1 border-gray-300 dark:border-gray-700" />
        </div>

        {/* Guest demo login button — Requirement 8.1, 8.2 */}
        <GuestLoginButton />
      </div>
    </main>
  );
}
