'use server';

/**
 * Guest demo authentication Server Action.
 *
 * Authenticates the pre-seeded guest account (guest@apex-demo.com) via the
 * Clerk Backend API using a sign-in token, then redirects the user to the
 * dashboard. On any Clerk API failure the action returns a generic error
 * category message without exposing raw error details.
 *
 * Requirements: 8.2, 8.4, 8.5
 */

import { clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Authenticates the guest demo account and redirects to /dashboard.
 *
 * Flow:
 * 1. Look up the guest user by email via the Clerk Backend API.
 * 2. Create a short-lived sign-in token (60 s) for that user.
 * 3. Redirect to the Clerk sign-in page with the token as a query param —
 *    Clerk automatically signs the user in and then redirects to the
 *    configured `afterSignInUrl` (i.e. /dashboard).
 *
 * On any failure, returns `{ error: 'Authentication service unavailable' }`
 * without leaking raw API error details, stack traces, or internal identifiers.
 *
 * Requirements: 8.2, 8.4, 8.5
 */
export async function guestLogin(): Promise<{ error: string } | void> {
  try {
    const client = await clerkClient();

    // Locate the pre-seeded guest user by email address
    const users = await client.users.getUserList({
      emailAddress: ['guest@apex-demo.com'],
    });

    const guestUser = users.data[0];
    if (!guestUser) {
      return { error: 'Authentication service unavailable' };
    }

    // Create a short-lived sign-in token (60 seconds)
    const token = await client.signInTokens.createSignInToken({
      userId: guestUser.id,
      expiresInSeconds: 60,
    });

    // Redirect to the Clerk sign-in page with the token — Clerk auto-signs
    // in the user and then redirects to /dashboard (afterSignInUrl).
    // `redirect()` throws internally so this line never returns normally.
    redirect(`/sign-in?__clerk_ticket=${token.token}`);
  } catch (err) {
    // Re-throw Next.js redirect "errors" so the redirect actually fires
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    // All other errors are swallowed; return a safe category message
    return { error: 'Authentication service unavailable' };
  }
}
