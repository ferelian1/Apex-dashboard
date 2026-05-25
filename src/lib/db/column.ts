/**
 * Column database query helpers.
 *
 * All helpers accept a userId for authorization and use the db singleton.
 * Returns null for missing records rather than throwing.
 *
 * Requirements: 9.4
 */

import { db } from '@/lib/db/prisma';
import type { ColumnWithTasks } from '@/types';
import type { Column } from '@prisma/client';

/**
 * Returns all columns for a board ordered by position ASC.
 * Verifies the requesting user is a member of the board's workspace.
 * Returns null if the board does not exist or the user is not authorized.
 */
export async function getColumnsByBoard(
  boardId: string,
  userId: string,
): Promise<Column[] | null> {
  const board = await db.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });

  if (!board) return null;

  // Verify the requesting user is a member of the workspace
  const member = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: board.workspaceId, userId },
    },
  });

  if (!member) return null;

  const columns = await db.column.findMany({
    where: { boardId },
    orderBy: { position: 'asc' },
  });

  return columns;
}

/**
 * Returns a column with its tasks ordered by position ASC, including each
 * task's assignee.
 * Verifies the requesting user is a member of the column's board's workspace.
 * Returns null if not found or the user is not authorized.
 */
export async function getColumnWithTasks(
  columnId: string,
  userId: string,
): Promise<ColumnWithTasks | null> {
  const column = await db.column.findUnique({
    where: { id: columnId },
    include: {
      tasks: {
        orderBy: { position: 'asc' },
        include: {
          assignee: {
            select: { id: true, name: true, image: true },
          },
        },
      },
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

  // Strip the eagerly-loaded board relation before returning (not part of ColumnWithTasks)
  const { board: _board, ...columnWithTasks } = column;
  return columnWithTasks;
}
