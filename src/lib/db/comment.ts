/**
 * Comment database query helpers.
 *
 * All helpers accept a userId for authorization and use the db singleton.
 * Returns null for missing records rather than throwing.
 *
 * Requirements: 9.4
 */

import { db } from '@/lib/db/prisma';
import type { Comment, User } from '@prisma/client';

/** A comment with the author's public profile fields. */
export type CommentWithUser = Comment & {
  user: Pick<User, 'id' | 'name' | 'image'>;
};

/**
 * Returns all comments for a task ordered by createdAt ASC, including the
 * author's user pick (id, name, image).
 * Verifies the requesting user is a member of the task's board's workspace.
 * Returns null if the task does not exist or the user is not authorized.
 */
export async function getCommentsByTask(
  taskId: string,
  userId: string,
): Promise<CommentWithUser[] | null> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      board: {
        select: { workspaceId: true },
      },
    },
  });

  if (!task) return null;

  // Verify the requesting user is a member of the workspace
  const member = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: task.board.workspaceId, userId },
    },
  });

  if (!member) return null;

  const comments = await db.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return comments;
}
