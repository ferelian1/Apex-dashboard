'use server';

/**
 * Task Server Actions.
 * Requirements: 10.2, 10.3, 11.1, 11.3, 11.4, 11.5, 11.6
 */

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/prisma';
import { requireWorkspaceMember, UnauthorizedError } from '@/lib/services/clerk';
import { CreateTaskSchema, UpdateTaskSchema, MoveTaskSchema } from '@/lib/utils/validation';
import { needsRenumbering, renumberPositions } from '@/lib/utils/position';
import type { ActionResult, TaskWithDetails } from '@/types';
import type { Task } from '@prisma/client';

function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === code
  );
}

// ---------------------------------------------------------------------------
// getTaskDetails — server action for fetching task details from client components
// ---------------------------------------------------------------------------

export async function getTaskDetails(
  taskId: string,
): Promise<ActionResult<TaskWithDetails>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      board: { select: { workspaceId: true } },
    },
  });

  if (!task) return { success: false, error: 'Task not found' };

  try {
    await requireWorkspaceMember(task.board.workspaceId, userId);
  } catch {
    return { success: false, error: 'Unauthorized' };
  }

  const { board: _board, ...taskWithDetails } = task;
  return { success: true, data: taskWithDetails as TaskWithDetails };
}

// ---------------------------------------------------------------------------
// createTask
// ---------------------------------------------------------------------------

export async function createTask(input: unknown): Promise<ActionResult<Task>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

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

  const column = await db.column.findUnique({
    where: { id: columnId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!column) return { success: false, error: 'Column not found' };

  try {
    await requireWorkspaceMember(column.board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) return { success: false, error: 'Unauthorized' };
    return { success: false, error: 'An unexpected error occurred' };
  }

  const lastTask = await db.task.findFirst({
    where: { columnId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  const position = lastTask ? lastTask.position + 1000 : 1000;

  try {
    const task = await db.task.create({
      data: {
        columnId, boardId, title,
        description: description ?? null,
        position,
        priority: priority ?? 'MEDIUM',
        assigneeId: assigneeId ?? null,
        dueDate: dueDate ?? null,
        labels: labels ?? [],
      },
    });
    revalidatePath(`/dashboard/workspace`);
    return { success: true, data: task };
  } catch (err) {
    if (isPrismaError(err, 'P2002')) return { success: false, error: 'A task at this position already exists' };
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// updateTask
// ---------------------------------------------------------------------------

export async function updateTask(taskId: string, input: unknown): Promise<ActionResult<Task>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  const parsed = UpdateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const existing = await db.task.findUnique({
    where: { id: taskId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!existing) return { success: false, error: 'Task not found' };

  try {
    await requireWorkspaceMember(existing.board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) return { success: false, error: 'Unauthorized' };
    return { success: false, error: 'An unexpected error occurred' };
  }

  try {
    const task = await db.task.update({ where: { id: taskId }, data: parsed.data });
    revalidatePath(`/dashboard/workspace`);
    return { success: true, data: task };
  } catch (err) {
    if (isPrismaError(err, 'P2002')) return { success: false, error: 'A task with this position already exists' };
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------

export async function deleteTask(taskId: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  const existing = await db.task.findUnique({
    where: { id: taskId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!existing) return { success: false, error: 'Task not found' };

  try {
    await requireWorkspaceMember(existing.board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) return { success: false, error: 'Unauthorized' };
    return { success: false, error: 'An unexpected error occurred' };
  }

  try {
    await db.task.delete({ where: { id: taskId } });
    revalidatePath(`/dashboard/workspace`);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ---------------------------------------------------------------------------
// moveTask
// ---------------------------------------------------------------------------

export async function moveTask(input: unknown): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  const parsed = MoveTaskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { taskId, sourceColumnId, destinationColumnId, newPosition } = parsed.data;

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { board: { select: { workspaceId: true } } },
  });
  if (!task) return { success: false, error: 'Task not found' };

  try {
    await requireWorkspaceMember(task.board.workspaceId, userId);
  } catch (err) {
    if (err instanceof UnauthorizedError) return { success: false, error: 'Unauthorized' };
    return { success: false, error: 'An unexpected error occurred' };
  }

  if (sourceColumnId === destinationColumnId && task.position === newPosition) {
    return { success: true, data: undefined };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: { columnId: destinationColumnId, position: newPosition },
      });

      const sourceTasks = await tx.task.findMany({
        where: { columnId: sourceColumnId },
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
      });
      if (sourceTasks.length >= 2) {
        const needsRenumber = sourceTasks.some((t, i) => {
          if (i === 0) return false;
          return needsRenumbering(sourceTasks[i - 1].position, t.position);
        });
        if (needsRenumber) {
          const newPositions = renumberPositions(sourceTasks.length);
          await Promise.all(
            sourceTasks.map((t, idx) =>
              tx.task.update({ where: { id: t.id }, data: { position: newPositions[idx] } }),
            ),
          );
        }
      }

      const destTasks = await tx.task.findMany({
        where: { columnId: destinationColumnId },
        orderBy: { position: 'asc' },
        select: { id: true, position: true },
      });
      if (destTasks.length >= 2) {
        const needsRenumber = destTasks.some((t, i) => {
          if (i === 0) return false;
          return needsRenumbering(destTasks[i - 1].position, t.position);
        });
        if (needsRenumber) {
          const newPositions = renumberPositions(destTasks.length);
          await Promise.all(
            destTasks.map((t, idx) =>
              tx.task.update({ where: { id: t.id }, data: { position: newPositions[idx] } }),
            ),
          );
        }
      }
    });

    revalidatePath(`/dashboard/workspace`);
    return { success: true, data: undefined };
  } catch (err) {
    if (isPrismaError(err, 'P2002')) return { success: false, error: 'A task at this position already exists' };
    return { success: false, error: 'An unexpected error occurred' };
  }
}
