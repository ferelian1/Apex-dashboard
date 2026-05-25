import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared field definitions
// ---------------------------------------------------------------------------

const titleField = z
  .string()
  .min(1, 'Title must be at least 1 character')
  .max(255, 'Title must be at most 255 characters');

const labelsField = z
  .array(
    z.string().max(50, 'Each label must be at most 50 characters')
  )
  .max(10, 'A task can have at most 10 labels')
  .optional();

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

const workspaceRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER']);

// ---------------------------------------------------------------------------
// Task schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new task.
 * Validates: Requirements 11.5
 */
export const CreateTaskSchema = z.object({
  columnId: z.string().min(1, 'Column ID is required'),
  boardId: z.string().min(1, 'Board ID is required'),
  title: titleField,
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  assigneeId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  labels: labelsField,
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

/**
 * Schema for updating an existing task.
 * All fields are optional — only provided fields are updated.
 * Validates: Requirements 11.5
 */
export const UpdateTaskSchema = z.object({
  columnId: z.string().min(1).optional(),
  boardId: z.string().min(1).optional(),
  title: titleField.optional(),
  description: z.string().optional(),
  priority: priorityEnum.optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  labels: labelsField,
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

/**
 * Schema for moving a task to a different column or position.
 */
export const MoveTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  sourceColumnId: z.string().min(1, 'Source column ID is required'),
  destinationColumnId: z.string().min(1, 'Destination column ID is required'),
  newPosition: z.number().int().positive('Position must be a positive integer'),
});

export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;

// ---------------------------------------------------------------------------
// Column schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new column.
 */
export const CreateColumnSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  name: z
    .string()
    .min(1, 'Column name must be at least 1 character')
    .max(255, 'Column name must be at most 255 characters'),
  position: z.number().int().nonnegative('Position must be a non-negative integer').optional(),
  color: z.string().optional(),
});

export type CreateColumnInput = z.infer<typeof CreateColumnSchema>;

/**
 * Schema for updating an existing column.
 */
export const UpdateColumnSchema = z.object({
  name: z
    .string()
    .min(1, 'Column name must be at least 1 character')
    .max(255, 'Column name must be at most 255 characters')
    .optional(),
  color: z.string().nullable().optional(),
});

export type UpdateColumnInput = z.infer<typeof UpdateColumnSchema>;

/**
 * Schema for moving a column to a new position within a board.
 */
export const MoveColumnSchema = z.object({
  columnId: z.string().min(1, 'Column ID is required'),
  boardId: z.string().min(1, 'Board ID is required'),
  newPosition: z.number().int().nonnegative('Position must be a non-negative integer'),
});

export type MoveColumnInput = z.infer<typeof MoveColumnSchema>;

// ---------------------------------------------------------------------------
// Workspace schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new workspace.
 * Slug must contain only lowercase letters, digits, and hyphens.
 */
export const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name must be at least 1 character')
    .max(100, 'Workspace name must be at most 100 characters'),
  slug: z
    .string()
    .min(1, 'Slug must be at least 1 character')
    .max(100, 'Slug must be at most 100 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, digits, and hyphens'
    ),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

// ---------------------------------------------------------------------------
// Board schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new board within a workspace.
 */
export const CreateBoardSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  name: z
    .string()
    .min(1, 'Board name must be at least 1 character')
    .max(255, 'Board name must be at most 255 characters'),
  description: z.string().optional(),
});

export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;

// ---------------------------------------------------------------------------
// Member invitation schema
// ---------------------------------------------------------------------------

/**
 * Schema for inviting a member to a workspace.
 */
export const InviteMemberSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  email: z.string().email('Must be a valid email address'),
  role: workspaceRoleEnum.optional(),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
