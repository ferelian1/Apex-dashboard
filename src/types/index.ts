/**
 * Central re-export for all TypeScript type definitions.
 *
 * Import from '@/types' to access any type in the application.
 *
 * Requirements: 1.7
 */

export type {
  // Board relation types
  TaskWithAssignee,
  TaskWithDetails,
  ColumnWithTasks,
  BoardWithColumnsAndTasks,

  // Board Server Action input types
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  MoveColumnInput,

  // Server Action return type
  ActionResult,
} from './board';

export type {
  // Workspace relation types
  WorkspaceMemberWithUser,
  WorkspaceWithMembers,

  // Workspace/Board Server Action input types
  CreateWorkspaceInput,
  CreateBoardInput,
  InviteMemberInput,
} from './workspace';

export type {
  // Auth context types
  AuthUser,
  CurrentUser,
  WorkspaceMemberContext,
} from './auth';
