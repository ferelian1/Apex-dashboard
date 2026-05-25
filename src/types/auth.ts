/**
 * Authentication-related TypeScript type definitions.
 *
 * These types represent the authenticated user context used throughout
 * Server Components, Server Actions, and Client Components.
 *
 * Requirements: 1.7, 9.1
 */

import type { User, WorkspaceRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Auth context types
// ---------------------------------------------------------------------------

/**
 * The minimal user shape returned by Clerk's auth() helper.
 * Used in Server Components and Server Actions to identify the caller.
 */
export interface AuthUser {
  /** Clerk user ID (maps to User.clerkId in the database) */
  clerkId: string;
  /** Primary email address from Clerk */
  email: string;
  /** Display name (first + last name from Clerk, may be null) */
  name: string | null;
  /** Profile image URL from Clerk, may be null */
  image: string | null;
}

/**
 * The full current user, combining Clerk identity with the database record.
 * Used in components that need both the Clerk session and the database User.
 */
export interface CurrentUser extends AuthUser {
  /** Database primary key (User.id) */
  id: string;
  /** Whether this user is the pre-seeded guest demo account */
  isGuest: boolean;
}

/**
 * The current user's membership context within a specific workspace.
 * Used in Server Actions to enforce role-based access control.
 */
export interface WorkspaceMemberContext {
  /** Database User record */
  user: Pick<User, 'id' | 'clerkId' | 'email' | 'name' | 'image'>;
  /** The user's role in the workspace */
  role: WorkspaceRole;
  /** The workspace ID this context applies to */
  workspaceId: string;
}
