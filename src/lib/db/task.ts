/**
 * Task database query helpers.
 *
 * All helpers accept a userId for authorization and use the db singleton.
 * Returns null for missing records rather than throwing.
 *
 * Requirements: 9.4
 */

import { db } from '@/lib/db/prisma';
import type { TaskWithDetails, TaskWithAssignee } from '@/types';

/**
 * Returns a task with full details: assignee pick and all comments with their
 * author's user pick (id, name, image).
 * Verifies the requesting user is a member of the task's board's workspace.
 * Returns null if not found or the user is not authorized.
 */
export async function getTaskWithDetails(
  taskId: string,
  userId: string,
): Promise<TaskWithDetails | null> {
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: { id: true, name: true, image: true },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
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

  // Strip the eagerly-loaded board relation before returning (not part of TaskWithDetails)
  const { board: _board, ...taskWithDetails } = task;
  return taskWithDetails;
}

/**
 * Returns all tasks in a column ordered by position ASC, including each
 * task's assignee pick.
 * Verifies the requesting user is a member of the column's board's workspace.
 * Returns null if the column does not exist or the user is not authorized.
 */
export async function getTasksByColumn(
  columnId: string,
  userId: string,
): Promise<TaskWithAssignee[] | null> {
  const column = await db.column.findUnique({
    where: { id: columnId },
    include: {
      board: {
        select: { workspaceId: true },
      },
    },
  });

  if (!column) return null;

  // Verify the requesting user is a member of the workspace
  const member = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: column.board.workspaceId, userId },
    },
  });

  if (!member) return null;

  const tasks = await db.task.findMany({
    where: { columnId },
    orderBy: { position: 'asc' },
    include: {
      assignee: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return tasks;
}
