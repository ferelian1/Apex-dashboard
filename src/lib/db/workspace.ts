/**
 * Workspace database query helpers.
 *
 * All helpers accept a userId for authorization and use the db singleton.
 * Returns null for missing records rather than throwing.
 *
 * Requirements: 9.4
 */

import { db } from '@/lib/db/prisma';
import type { WorkspaceWithMembers, WorkspaceMemberWithUser } from '@/types';
import type { Workspace } from '@prisma/client';

/**
 * Finds a workspace by slug and verifies the requesting user is a member.
 * Returns the workspace with all members (including user info), or null if not found
 * or the user is not a member.
 */
export async function getWorkspaceBySlug(
  slug: string,
  userId: string,
): Promise<WorkspaceWithMembers | null> {
  const workspace = await db.workspace.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  });

  if (!workspace) return null;

  // Verify the requesting user is a member
  const isMember = workspace.members.some((m) => m.userId === userId);
  if (!isMember) return null;

  return workspace;
}

/**
 * Returns all workspaces where the user is a member, including the board count
 * for each workspace.
 */
export async function getWorkspacesForUser(
  userId: string,
): Promise<(Workspace & { _count: { boards: number } })[]> {
  const memberships = await db.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: {
            select: { boards: true },
          },
        },
      },
    },
  });

  return memberships.map((m) => m.workspace);
}

/**
 * Returns all members of a workspace with their user info.
 * Verifies the requesting user is a member before returning data.
 * Returns null if the workspace does not exist or the user is not a member.
 */
export async function getWorkspaceMembers(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMemberWithUser[] | null> {
  // Verify the requesting user is a member
  const requestingMember = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });

  if (!requestingMember) return null;

  const members = await db.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return members;
}
