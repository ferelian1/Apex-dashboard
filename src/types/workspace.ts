/**
 * Workspace-related TypeScript type definitions.
 *
 * These types extend the Prisma-generated models with relation data
 * and define the input shapes for workspace/board Server Actions.
 *
 * Requirements: 1.7
 */

import type { Workspace, WorkspaceMember, User, WorkspaceRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Relation types
// ---------------------------------------------------------------------------

/**
 * A WorkspaceMember record with the associated user's public profile.
 */
export type WorkspaceMemberWithUser = WorkspaceMember & {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
};

/**
 * A Workspace with all its members (each member includes the user profile).
 * Used in workspace settings and member management views.
 */
export type WorkspaceWithMembers = Workspace & {
  members: WorkspaceMemberWithUser[];
};

// ---------------------------------------------------------------------------
// Server Action input types
// ---------------------------------------------------------------------------

/**
 * Input for creating a new workspace.
 * Slug must contain only lowercase letters, digits, and hyphens.
 * Requirements: 3.1
 */
export interface CreateWorkspaceInput {
  /** 1–100 characters */
  name: string;
  /** 1–100 characters, pattern: /^[a-z0-9-]+$/ */
  slug: string;
  /** Optional, maximum 500 characters */
  description?: string;
}

/**
 * Input for creating a new board within a workspace.
 * Requirements: 4.1
 */
export interface CreateBoardInput {
  workspaceId: string;
  /** 1–255 characters, unique per workspace */
  name: string;
  description?: string;
}

/**
 * Input for inviting a new member to a workspace.
 * Requirements: 3.2
 */
export interface InviteMemberInput {
  workspaceId: string;
  /** Must be a valid email address */
  email: string;
  role?: WorkspaceRole;
}
