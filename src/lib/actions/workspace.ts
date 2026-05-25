'use server';

/**
 * Workspace and Board Server Actions.
 *
 * Provides mutations for creating workspaces, creating boards, and inviting
 * members to a workspace. All actions validate the Clerk session, validate
 * input with Zod, enforce workspace membership via requireWorkspaceMember,
 * execute Prisma mutations, and revalidate the Next.js cache.
 *
 * Requirements: 9.4
 */

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/prisma';
import { requireWorkspaceMember, UnauthorizedError } from '@/lib/services/clerk';
import {
  CreateWorkspaceSchema,
  CreateBoardSchema,
  InviteMemberSchema,
} from '@/lib/utils/validation';
import type { ActionResult } from '@/types';
import type { Workspace, Board, WorkspaceMember } from '@prisma/client';
import { WorkspaceRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// createWorkspace
// ---------------------------------------------------------------------------

/**
 * Creates a new workspace and adds the authenticated user as OWNER.
 *
 * The workspace and the initial WorkspaceMember record are created in a single
 * Prisma transaction to ensure consistency. A P2002 (unique constraint) error
 * on the slug field is surfaced as a user-facing message.
 *
 * Requirements: 9.4
 */
export async function createWorkspace(
  input: unknown,
): Promise<ActionResult<Workspace>> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Resolve database user
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 3. Validate input
  const parsed = CreateWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, slug, description } = parsed.data;

  try {
    // 4. Create workspace + owner membership in a transaction
    const workspace = await db.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name,
          slug,
          description,
          ownerId: user.id,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      });

      return ws;
    });

    revalidatePath('/dashboard');
    return { success: true, data: workspace };
  } catch (err: unknown) {
    // P2002 — unique constraint violation (slug already taken)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return { success: false, error: 'A workspace with this slug already exists' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// createBoard
// ---------------------------------------------------------------------------

/**
 * Creates a new board within a workspace.
 *
 * The caller must be a member of the target workspace. A P2002 error on the
 * (workspaceId, name) unique index is surfaced as a user-facing message.
 *
 * Requirements: 9.4
 */
export async function createBoard(
  input: unknown,
): Promise<ActionResult<Board>> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const parsed = CreateBoardSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { workspaceId, name, description } = parsed.data;

  // 3. Enforce workspace membership
  try {
    await requireWorkspaceMember(workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }

  try {
    // 4. Create board
    const board = await db.board.create({
      data: {
        workspaceId,
        name,
        description,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, data: board };
  } catch (err: unknown) {
    // P2002 — unique constraint violation (board name already exists in workspace)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return {
        success: false,
        error: 'A board with this name already exists in this workspace',
      };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// inviteMember
// ---------------------------------------------------------------------------

/**
 * Invites an existing user (by email) to a workspace.
 *
 * The inviting user must already be a member of the workspace. The target user
 * must have a database record (i.e. they have signed up and the Clerk webhook
 * has synced their account). A P2002 error on the (workspaceId, userId) unique
 * index is surfaced as a user-facing message.
 *
 * Requirements: 9.4
 */
export async function inviteMember(
  input: unknown,
): Promise<ActionResult<WorkspaceMember>> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const parsed = InviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { workspaceId, email, role } = parsed.data;

  // 3. Enforce workspace membership for the inviting user
  try {
    await requireWorkspaceMember(workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }

  // 4. Resolve the target user by email
  const targetUser = await db.user.findUnique({ where: { email } });
  if (!targetUser) {
    return {
      success: false,
      error: 'User not found. They must sign up first.',
    };
  }

  try {
    // 5. Create WorkspaceMember record
    const member = await db.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role: role ?? WorkspaceRole.MEMBER,
      },
    });

    revalidatePath('/dashboard');
    return { success: true, data: member };
  } catch (err: unknown) {
    // P2002 — unique constraint violation (user already a member)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2002'
    ) {
      return {
        success: false,
        error: 'User is already a member of this workspace',
      };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}
