/**
 * Clerk server-side helpers for authentication and authorization.
 *
 * Provides utilities for resolving the current authenticated user from the
 * Clerk session and enforcing workspace membership before executing
 * workspace-scoped Server Actions.
 *
 * Requirements: 9.4
 */

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/prisma';
import type { User, WorkspaceMember } from '@prisma/client';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown when a request fails an authorization check (no session, user not
 * found in the database, or user is not a member of the target workspace).
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// ---------------------------------------------------------------------------
// getCurrentUser
// ---------------------------------------------------------------------------

/**
 * Resolves the currently authenticated Clerk session to a database User record.
 *
 * Returns `null` when:
 * - There is no active Clerk session (unauthenticated request).
 * - The Clerk `userId` does not match any User record in the database (e.g.,
 *   the webhook has not yet synced the new account).
 *
 * The returned object extends the Prisma `User` model with an `isGuest`
 * boolean that is `true` when the user's email matches the pre-seeded guest
 * demo account (`guest@apex-demo.com`).
 *
 * Requirements: 9.4
 */
export async function getCurrentUser(): Promise<(User & { isGuest: boolean }) | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    isGuest: user.email === 'guest@apex-demo.com',
  };
}

// ---------------------------------------------------------------------------
// requireWorkspaceMember
// ---------------------------------------------------------------------------

/**
 * Authorization guard used by all workspace-scoped Server Actions.
 *
 * Verifies that the Clerk user identified by `clerkId` exists in the database
 * **and** holds a `WorkspaceMember` record for the given `workspaceId`.
 *
 * @param workspaceId - The workspace to check membership for.
 * @param clerkId     - The Clerk user ID obtained from `auth().userId`.
 *
 * @returns An object containing the resolved `user` (database User record) and
 *          `member` (WorkspaceMember record) on success.
 *
 * @throws {UnauthorizedError} When the user is not found in the database or is
 *         not a member of the specified workspace.
 *
 * Requirements: 9.4
 */
export async function requireWorkspaceMember(
  workspaceId: string,
  clerkId: string,
): Promise<{ user: User; member: WorkspaceMember }> {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) throw new UnauthorizedError('User not found');

  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  });
  if (!member) throw new UnauthorizedError('Not a workspace member');

  return { user, member };
}
