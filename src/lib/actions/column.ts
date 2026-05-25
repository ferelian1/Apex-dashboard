'use server';

/**
 * Column Server Actions.
 *
 * Provides mutations for creating, updating, deleting, and moving columns
 * within a Kanban board. All actions validate the Clerk session, validate
 * input with Zod, enforce workspace membership via requireWorkspaceMember,
 * execute Prisma mutations, and revalidate the Next.js cache.
 *
 * Requirements: 10.4
 */

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/prisma';
import { requireWorkspaceMember, UnauthorizedError } from '@/lib/services/clerk';
import {
  CreateColumnSchema,
  UpdateColumnSchema,
  MoveColumnSchema,
} from '@/lib/utils/validation';
import {
  calculateInsertPosition,
  needsRenumbering,
  renumberPositions,
} from '@/lib/utils/position';
import type { ActionResult } from '@/types';
import type { Column } from '@prisma/client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether an error is a Prisma known request error with the given code.
 */
function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === code
  );
}

// ---------------------------------------------------------------------------
// createColumn
// ---------------------------------------------------------------------------

/**
 * Creates a new column at the end of the board's column list.
 *
 * The position is calculated as (max existing position + 1000), or 1000 if
 * the board has no columns yet. The caller must be a member of the board's
 * workspace.
 *
 * Requirements: 10.4
 */
export async function createColumn(input: unknown): Promise<ActionResult<Column>> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const parsed = CreateColumnSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { boardId, name, color } = parsed.data;

  // 3. Resolve board to get workspaceId
  const board = await db.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });
  if (!board) {
    return { success: false, error: 'Board not found' };
  }

  // 4. Enforce workspace membership
  try {
    await requireWorkspaceMember(board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }

  // 5. Calculate position: max existing position + 1000, or 1000 if empty
  const lastColumn = await db.column.findFirst({
    where: { boardId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = lastColumn ? lastColumn.position + 1000 : 1000;

  try {
    // 6. Create column
    const column = await db.column.create({
      data: {
        boardId,
        name,
        position,
        color: color ?? null,
      },
    });

    revalidatePath(`/workspace/${board.workspaceId}/board/${boardId}`);
    return { success: true, data: column };
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return { success: false, error: 'A column at this position already exists' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// updateColumn
// ---------------------------------------------------------------------------

/**
 * Updates a column's name and/or color.
 *
 * The caller must be a member of the column's board's workspace.
 *
 * Requirements: 10.4
 */
export async function updateColumn(
  columnId: string,
  input: unknown,
): Promise<ActionResult<Column>> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const parsed = UpdateColumnSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // 3. Resolve column to get boardId and workspaceId
  const existing = await db.column.findUnique({
    where: { id: columnId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!existing) {
    return { success: false, error: 'Column not found' };
  }

  // 4. Enforce workspace membership
  try {
    await requireWorkspaceMember(existing.board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }

  try {
    // 5. Update column
    const column = await db.column.update({
      where: { id: columnId },
      data: parsed.data,
    });

    revalidatePath(`/workspace/${existing.board.workspaceId}/board/${existing.boardId}`);
    return { success: true, data: column };
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return { success: false, error: 'A column with this name already exists' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// deleteColumn
// ---------------------------------------------------------------------------

/**
 * Deletes a column and all its tasks (cascade via Prisma schema).
 *
 * The caller must be a member of the column's board's workspace.
 *
 * Requirements: 10.4
 */
export async function deleteColumn(columnId: string): Promise<ActionResult> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Resolve column to get boardId and workspaceId
  const existing = await db.column.findUnique({
    where: { id: columnId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!existing) {
    return { success: false, error: 'Column not found' };
  }

  // 3. Enforce workspace membership
  try {
    await requireWorkspaceMember(existing.board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }

  try {
    // 4. Delete column (tasks cascade via schema onDelete: Cascade)
    await db.column.delete({ where: { id: columnId } });

    revalidatePath(`/workspace/${existing.board.workspaceId}/board/${existing.boardId}`);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return { success: false, error: 'Unable to delete column due to a conflict' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// moveColumn
// ---------------------------------------------------------------------------

/**
 * Moves a column to a new position within its board.
 *
 * The algorithm:
 * 1. Fetch all columns for the board ordered by position ASC.
 * 2. Remove the moving column from the array.
 * 3. Insert it at the target index (newPosition).
 * 4. Calculate the new position value using calculateInsertPosition with the
 *    neighbours at newIndex - 1 and newIndex in the reordered array.
 * 5. If the gap is exhausted (needsRenumbering), renumber all columns in a
 *    Prisma transaction; otherwise just update the moved column's position.
 *
 * The entire mutation is executed inside a Prisma transaction.
 *
 * Requirements: 10.4
 */
export async function moveColumn(input: unknown): Promise<ActionResult> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const parsed = MoveColumnSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { columnId, boardId, newPosition } = parsed.data;

  // 3. Resolve board to get workspaceId
  const board = await db.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });
  if (!board) {
    return { success: false, error: 'Board not found' };
  }

  // 4. Enforce workspace membership
  try {
    await requireWorkspaceMember(board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }

  // 5. Fetch all columns for the board ordered by position ASC
  const allColumns = await db.column.findMany({
    where: { boardId },
    orderBy: { position: 'asc' },
  });

  // 6. Remove the moving column from the array
  const movingColumn = allColumns.find((c) => c.id === columnId);
  if (!movingColumn) {
    return { success: false, error: 'Column not found in this board' };
  }

  const withoutMoving = allColumns.filter((c) => c.id !== columnId);

  // 7. Clamp newPosition to valid range and insert at target index
  const clampedIndex = Math.min(newPosition, withoutMoving.length);
  const reordered = [
    ...withoutMoving.slice(0, clampedIndex),
    movingColumn,
    ...withoutMoving.slice(clampedIndex),
  ];

  // 8. Determine neighbours for position calculation
  const before = withoutMoving[clampedIndex - 1]?.position ?? null;
  const after = withoutMoving[clampedIndex]?.position ?? null;

  const calculatedPosition = calculateInsertPosition(before, after);

  // 9. Determine if full renumbering is needed
  const requiresRenumber =
    before !== null && after !== null && needsRenumbering(before, after);

  try {
    await db.$transaction(async (tx) => {
      if (requiresRenumber) {
        // Full renumber: assign fresh positions to all columns in their new order
        const newPositions = renumberPositions(reordered.length);
        await Promise.all(
          reordered.map((col, idx) =>
            tx.column.update({
              where: { id: col.id },
              data: { position: newPositions[idx] },
            }),
          ),
        );
      } else {
        // Only update the moved column's position
        await tx.column.update({
          where: { id: columnId },
          data: { position: calculatedPosition },
        });
      }
    });

    revalidatePath(`/workspace/${board.workspaceId}/board/${boardId}`);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return { success: false, error: 'A column at this position already exists' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}
