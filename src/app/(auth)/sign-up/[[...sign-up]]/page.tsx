/**
 * Sign-up page — renders the standard Clerk <SignUp /> component.
 *
 * Requirements: 9.1, 9.2
 */

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <SignUp />
    </main>
  );
}
