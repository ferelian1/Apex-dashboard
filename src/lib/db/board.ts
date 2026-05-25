/**
 * Board database query helpers.
 *
 * All helpers accept a userId for authorization and use the db singleton.
 * Returns null for missing records rather than throwing.
 *
 * Requirements: 9.4
 */

import { db } from '@/lib/db/prisma';
import type { BoardWithColumnsAndTasks } from '@/types';
import type { Board } from '@prisma/client';

/**
 * Returns a board with all its columns (ordered by position ASC) and tasks
 * within each column (ordered by position ASC), including each task's assignee.
 * Verifies the requesting user is a member of the board's workspace.
 * Returns null if not found or the user is not authorized.
 */
export async function getBoardWithColumnsAndTasks(
  boardId: string,
  userId: string,
): Promise<BoardWithColumnsAndTasks | null> {
  const board = await db.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { position: 'asc' },
        include: {
          tasks: {
            orderBy: { position: 'asc' },
            include: {
              assignee: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      },
    },
  });

  if (!board) return null;

  // Verify the requesting user is a member of the workspace
  const member = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: board.workspaceId, userId },
    },
  });

  if (!member) return null;

  return board;
}

/**
 * Returns all boards for a workspace.
 * Verifies the requesting user is a member of the workspace.
 * Returns null if the workspace does not exist or the user is not a member.
 */
export async function getBoardsForWorkspace(
  workspaceId: string,
  userId: string,
): Promise<Board[] | null> {
  // Verify the requesting user is a member
  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });

  if (!member) return null;

  const boards = await db.board.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'asc' },
  });

  return boards;
}
