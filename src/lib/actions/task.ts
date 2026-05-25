'use server';

/**
 * Task Server Actions.
 *
 * Provides mutations for creating, updating, deleting, and moving tasks
 * within a Kanban board. All actions validate the Clerk session, validate
 * input with Zod, enforce workspace membership via requireWorkspaceMember,
 * execute Prisma mutations, and revalidate the Next.js cache.
 *
 * Requirements: 10.2, 10.3, 11.1, 11.3, 11.4, 11.5, 11.6
 */

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/prisma';
import { requireWorkspaceMember, UnauthorizedError } from '@/lib/services/clerk';
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  MoveTaskSchema,
} from '@/lib/utils/validation';
import { needsRenumbering, renumberPositions } from '@/lib/utils/position';
import type { ActionResult } from '@/types';
import type { Task } from '@prisma/client';

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
// createTask
// ---------------------------------------------------------------------------

/**
 * Creates a new task at the end of the column's task list.
 *
 * The position is calculated as (max existing position + 1000), or 1000 if
 * the column has no tasks yet. The caller must be a member of the board's
 * workspace.
 *
 * Requirements: 11.1, 11.5
 */
export async function createTask(input: unknown): Promise<ActionResult<Task>> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const parsed = CreateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { columnId, boardId, title, description, priority, assigneeId, dueDate, labels } =
    parsed.data;

  // 3. Resolve column to get workspaceId
  const column = await db.column.findUnique({
    where: { id: columnId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!column) {
    return { success: false, error: 'Column not found' };
  }

  // 4. Enforce workspace membership
  try {
    await requireWorkspaceMember(column.board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }

  // 5. Calculate position: max existing position + 1000, or 1000 if empty
  const lastTask = await db.task.findFirst({
    where: { columnId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = lastTask ? lastTask.position + 1000 : 1000;

  try {
    // 6. Create task
    const task = await db.task.create({
      data: {
        columnId,
        boardId,
        title,
        description: description ?? null,
        position,
        priority: priority ?? 'MEDIUM',
        assigneeId: assigneeId ?? null,
        dueDate: dueDate ?? null,
        labels: labels ?? [],
      },
    });

    revalidatePath(`/workspace/${column.board.workspaceId}/board/${boardId}`);
    return { success: true, data: task };
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return { success: false, error: 'A task at this position already exists' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// updateTask
// ---------------------------------------------------------------------------

/**
 * Updates a task's fields (title, description, priority, assignee, due date, labels).
 *
 * All fields are optional — only provided fields are updated. The caller must
 * be a member of the task's board's workspace.
 *
 * Requirements: 11.3, 11.5
 */
export async function updateTask(
  taskId: string,
  input: unknown,
): Promise<ActionResult<Task>> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const parsed = UpdateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // 3. Resolve task to get boardId and workspaceId
  const existing = await db.task.findUnique({
    where: { id: taskId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!existing) {
    return { success: false, error: 'Task not found' };
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
    // 5. Update task
    const task = await db.task.update({
      where: { id: taskId },
      data: parsed.data,
    });

    revalidatePath(`/workspace/${existing.board.workspaceId}/board/${existing.boardId}`);
    return { success: true, data: task };
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return { success: false, error: 'A task with this position already exists' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------

/**
 * Deletes a task and all its comments (cascade via Prisma schema).
 *
 * The caller must be a member of the task's board's workspace.
 *
 * Requirements: 11.4, 11.6
 */
export async function deleteTask(taskId: string): Promise<ActionResult> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Resolve task to get boardId and workspaceId
  const existing = await db.task.findUnique({
    where: { id: taskId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!existing) {
    return { success: false, error: 'Task not found' };
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
    // 4. Delete task (comments cascade via schema onDelete: Cascade)
    await db.task.delete({ where: { id: taskId } });

    revalidatePath(`/workspace/${existing.board.workspaceId}/board/${existing.boardId}`);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return { success: false, error: 'Unable to delete task due to a conflict' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// moveTask
// ---------------------------------------------------------------------------

/**
 * Moves a task to a new position within the same column or to a different column.
 *
 * The algorithm:
 * 1. Validate input and enforce workspace membership.
 * 2. No-op check: if source === destination column and position is unchanged, return early.
 * 3. Execute a Prisma transaction:
 *    a. Update the moved task's columnId and position.
 *    b. Fetch all tasks in the source column; renumber if gaps are exhausted.
 *    c. Fetch all tasks in the destination column; renumber if gaps are exhausted.
 * 4. Revalidate the board path.
 *
 * Requirements: 10.2, 10.3
 */
export async function moveTask(input: unknown): Promise<ActionResult> {
  // 1. Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate input
  const parsed = MoveTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { taskId, sourceColumnId, destinationColumnId, newPosition } = parsed.data;

  // 3. Resolve task to get boardId and workspaceId
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  // 4. Enforce workspace membership
  try {
    await requireWorkspaceMember(task.board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { success: false, error: 'Unauthorized' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }

  // 5. No-op check: same column and same position — nothing to do
  if (sourceColumnId === destinationColumnId && task.position === newPosition) {
    return { success: true, data: undefined };
  }

  try {
    await db.$transaction(async (tx) => {
      // 6a. Update moved task: set new column and position
      await tx.task.update({
        where: { id: taskId },
        data: { columnId: destinationColumnId, position: newPosition },
      });

      // 6b. Renumber source column if gaps are exhausted
      const sourceTasks = await tx.task.findMany({
        where: { columnId: sourceColumnId },
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
      });

      if (sourceTasks.length >= 2) {
        const sourceNeedsRenumber = sourceTasks.some((t, i) => {
          if (i === 0) return false;
          return needsRenumbering(sourceTasks[i - 1].position, t.position);
        });

        if (sourceNeedsRenumber) {
          const newPositions = renumberPositions(sourceTasks.length);
          await Promise.all(
            sourceTasks.map((t, idx) =>
              tx.task.update({
                where: { id: t.id },
                data: { position: newPositions[idx] },
              }),
            ),
          );
        }
      }

      // 6c. Renumber destination column if gaps are exhausted
      const destTasks = await tx.task.findMany({
        where: { columnId: destinationColumnId },
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
      });

      if (destTasks.length >= 2) {
        const destNeedsRenumber = destTasks.some((t, i) => {
          if (i === 0) return false;
          return needsRenumbering(destTasks[i - 1].position, t.position);
        });

        if (destNeedsRenumber) {
          const newPositions = renumberPositions(destTasks.length);
          await Promise.all(
            destTasks.map((t, idx) =>
              tx.task.update({
                where: { id: t.id },
                data: { position: newPositions[idx] },
              }),
            ),
          );
        }
      }
    });

    revalidatePath(`/workspace/${task.board.workspaceId}/board/${task.boardId}`);
    return { success: true, data: undefined };
  } catch (err: unknown) {
    if (isPrismaError(err, 'P2002')) {
      return { success: false, error: 'A task at this position already exists' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}
