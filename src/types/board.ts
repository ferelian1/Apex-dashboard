/**
 * Board-related TypeScript type definitions.
 *
 * These types extend the Prisma-generated models with relation data
 * and define the input shapes for Server Actions.
 *
 * Requirements: 1.7
 */

import type { Board, Column, Task, Comment, User, Priority } from '@prisma/client';

// ---------------------------------------------------------------------------
// Relation types — extend Prisma models with eager-loaded relations
// ---------------------------------------------------------------------------

/**
 * A Task with its assignee's public profile fields.
 * Used in column/board views where full user data is not needed.
 */
export type TaskWithAssignee = Task & {
  assignee: Pick<User, 'id' | 'name' | 'image'> | null;
};

/**
 * A Task with its assignee and all comments (each comment includes the author).
 * Used in the task detail modal.
 */
export type TaskWithDetails = TaskWithAssignee & {
  comments: (Comment & {
    user: Pick<User, 'id' | 'name' | 'image'>;
  })[];
};

/**
 * A Column with its tasks (each task includes the assignee).
 * Used when rendering a single column in the Kanban board.
 */
export type ColumnWithTasks = Column & {
  tasks: TaskWithAssignee[];
};

/**
 * A Board with all its columns and their tasks.
 * The top-level type passed to the BoardView component.
 */
export type BoardWithColumnsAndTasks = Board & {
  columns: ColumnWithTasks[];
};

// ---------------------------------------------------------------------------
// Server Action input types
// ---------------------------------------------------------------------------

/**
 * Input for creating a new task.
 * Validated by CreateTaskSchema in src/lib/utils/validation.ts.
 * Requirements: 11.1, 11.5
 */
export interface CreateTaskInput {
  columnId: string;
  boardId: string;
  /** 1–255 characters */
  title: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: Date;
  /** Maximum 10 items, each maximum 50 characters */
  labels?: string[];
}

/**
 * Input for updating an existing task.
 * All fields are optional — only provided fields are updated.
 * Requirements: 11.3, 11.5
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  assigneeId?: string | null;
  dueDate?: Date | null;
  labels?: string[];
}

/**
 * Input for moving a task to a different column or position within the same column.
 * Requirements: 10.2, 10.3
 */
export interface MoveTaskInput {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  newPosition: number;
}

/**
 * Input for reordering a column within a board.
 * Requirements: 10.4
 */
export interface MoveColumnInput {
  columnId: string;
  boardId: string;
  newPosition: number;
}

// ---------------------------------------------------------------------------
// Server Action return type
// ---------------------------------------------------------------------------

/**
 * Discriminated union returned by all Server Actions.
 * On success, `data` contains the result (void for mutations with no return value).
 * On failure, `error` is a user-facing message and `fieldErrors` contains
 * per-field validation errors for form display.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
