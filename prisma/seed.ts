/**
 * prisma/seed.ts — Database seed script for Apex Dashboard
 *
 * Seeds the Guest_User demo account and all associated demo data so that
 * recruiters can log in with one click and explore a fully-populated board.
 *
 * IMPORTANT — Clerk account setup (must be done separately):
 * ─────────────────────────────────────────────────────────
 * This script creates the Postgres `User` record for the guest account but
 * does NOT create the Clerk identity. You must create the Clerk account
 * manually (via the Clerk Dashboard or Clerk Backend API) before the guest
 * login flow will work:
 *
 *   Email    : guest@apex-demo.com
 *   Password : set GUEST_USER_PASSWORD in your .env / Vercel environment
 *
 * After creating the Clerk account, copy the resulting Clerk user ID (starts
 * with "user_") and set it as GUEST_CLERK_ID in your environment, then
 * re-run this seed so the `clerkId` field is updated to the real value.
 *
 * Usage:
 *   npx prisma db seed
 *   # or
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 *
 * The script is fully idempotent — safe to run multiple times.
 */

import { PrismaClient, Priority, WorkspaceRole } from '@prisma/client';

const db = new PrismaClient();

// ---------------------------------------------------------------------------
// Guest user constants
// ---------------------------------------------------------------------------

/**
 * Placeholder Clerk ID used until the real Clerk account is created.
 * Replace with the actual Clerk user ID (e.g. "user_2abc...") by setting
 * the GUEST_CLERK_ID environment variable before running the seed.
 */
const GUEST_CLERK_ID =
  process.env.GUEST_CLERK_ID ?? 'user_placeholder_guest_clerk_id';

const GUEST_EMAIL = 'guest@apex-demo.com';
const GUEST_NAME = 'Demo Guest';

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const WORKSPACE_NAME = 'Demo Workspace';
const WORKSPACE_SLUG = 'demo-workspace';

const BOARD_NAME = 'Product Roadmap';

const COLUMNS = [
  { name: 'To Do', position: 1000 },
  { name: 'In Progress', position: 2000 },
  { name: 'Done', position: 3000 },
] as const;

/** Three tasks per column — meaningful demo content for each lane. */
const TASKS_BY_COLUMN: Record<
  string,
  Array<{
    title: string;
    description: string;
    priority: Priority;
    position: number;
    labels: string[];
  }>
> = {
  'To Do': [
    {
      title: 'Design onboarding flow',
      description:
        'Create wireframes and user-flow diagrams for the new-user onboarding experience. Coordinate with the design team to align on brand guidelines.',
      priority: Priority.HIGH,
      position: 1000,
      labels: ['design', 'ux'],
    },
    {
      title: 'Set up CI/CD pipeline',
      description:
        'Configure GitHub Actions to run lint, type-check, and tests on every pull request. Add automatic deployment to Vercel preview environments.',
      priority: Priority.MEDIUM,
      position: 2000,
      labels: ['devops', 'infrastructure'],
    },
    {
      title: 'Write API documentation',
      description:
        'Document all public Server Actions and Route Handlers using JSDoc comments. Generate an OpenAPI spec for external consumers.',
      priority: Priority.LOW,
      position: 3000,
      labels: ['docs'],
    },
  ],
  'In Progress': [
    {
      title: 'Implement drag-and-drop reordering',
      description:
        'Integrate @dnd-kit/sortable for column and task reordering. Ensure optimistic UI updates apply within 100 ms and revert correctly on server errors.',
      priority: Priority.URGENT,
      position: 1000,
      labels: ['feature', 'frontend'],
    },
    {
      title: 'Add real-time collaboration',
      description:
        'Subscribe to Supabase Realtime Postgres Changes on the board channel. Call router.refresh() when remote mutations arrive so all clients stay in sync.',
      priority: Priority.HIGH,
      position: 2000,
      labels: ['feature', 'realtime'],
    },
    {
      title: 'Integrate Clerk authentication',
      description:
        'Wrap the root layout with ClerkProvider, configure middleware to protect dashboard routes, and implement the Clerk webhook handler to sync users.',
      priority: Priority.HIGH,
      position: 3000,
      labels: ['auth', 'backend'],
    },
  ],
  Done: [
    {
      title: 'Scaffold Next.js project',
      description:
        'Initialised Next.js 14 App Router project with TypeScript, Tailwind CSS, and Shadcn/ui. Configured the green primary palette and dark-mode support.',
      priority: Priority.MEDIUM,
      position: 1000,
      labels: ['setup'],
    },
    {
      title: 'Define Prisma schema',
      description:
        'Authored prisma/schema.prisma with User, Workspace, WorkspaceMember, Board, Column, Task, and Comment models including all indexes and cascade rules.',
      priority: Priority.HIGH,
      position: 2000,
      labels: ['database', 'backend'],
    },
    {
      title: 'Configure Supabase connection pooling',
      description:
        'Set DATABASE_URL to the PgBouncer endpoint (port 6543) with ?pgbouncer=true and DIRECT_URL to the direct connection (port 5432) for migrations.',
      priority: Priority.MEDIUM,
      position: 3000,
      labels: ['database', 'infrastructure'],
    },
  ],
};

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedGuestUser() {
  console.log('⏳  Upserting guest User record…');

  const user = await db.user.upsert({
    where: { email: GUEST_EMAIL },
    create: {
      clerkId: GUEST_CLERK_ID,
      email: GUEST_EMAIL,
      name: GUEST_NAME,
    },
    update: {
      // Update clerkId in case the real Clerk account was created after the
      // first seed run and GUEST_CLERK_ID now holds the real value.
      clerkId: GUEST_CLERK_ID,
      name: GUEST_NAME,
    },
  });

  console.log(`✅  Guest user: ${user.email} (id: ${user.id})`);
  return user;
}

async function seedWorkspace(ownerId: string) {
  console.log('⏳  Upserting Demo Workspace…');

  const workspace = await db.workspace.upsert({
    where: { slug: WORKSPACE_SLUG },
    create: {
      name: WORKSPACE_NAME,
      slug: WORKSPACE_SLUG,
      description: 'A pre-populated demo workspace for recruiter evaluation.',
      ownerId,
    },
    update: {
      name: WORKSPACE_NAME,
      description: 'A pre-populated demo workspace for recruiter evaluation.',
    },
  });

  console.log(`✅  Workspace: "${workspace.name}" (slug: ${workspace.slug})`);
  return workspace;
}

async function seedWorkspaceMember(workspaceId: string, userId: string) {
  console.log('⏳  Upserting WorkspaceMember record…');

  const member = await db.workspaceMember.upsert({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    create: {
      workspaceId,
      userId,
      role: WorkspaceRole.MEMBER,
    },
    update: {
      role: WorkspaceRole.MEMBER,
    },
  });

  console.log(`✅  WorkspaceMember: userId=${member.userId}, role=${member.role}`);
  return member;
}

async function seedBoard(workspaceId: string) {
  console.log('⏳  Upserting Product Roadmap board…');

  const board = await db.board.upsert({
    where: {
      workspaceId_name: { workspaceId, name: BOARD_NAME },
    },
    create: {
      workspaceId,
      name: BOARD_NAME,
      description: 'High-level product roadmap for the Apex Dashboard project.',
    },
    update: {
      description: 'High-level product roadmap for the Apex Dashboard project.',
    },
  });

  console.log(`✅  Board: "${board.name}" (id: ${board.id})`);
  return board;
}

async function seedColumns(boardId: string) {
  console.log('⏳  Upserting columns…');

  const results: Array<{ id: string; name: string; position: number }> = [];

  for (const col of COLUMNS) {
    // Upsert by boardId + position (unique constraint on schema)
    const column = await db.column.upsert({
      where: {
        boardId_position: { boardId, position: col.position },
      },
      create: {
        boardId,
        name: col.name,
        position: col.position,
      },
      update: {
        name: col.name,
      },
    });

    console.log(`  ✅  Column: "${column.name}" (position: ${column.position})`);
    results.push(column);
  }

  return results;
}

async function seedTasks(
  boardId: string,
  columns: Array<{ id: string; name: string; position: number }>,
) {
  console.log('⏳  Upserting tasks…');

  for (const column of columns) {
    const tasksForColumn = TASKS_BY_COLUMN[column.name];
    if (!tasksForColumn) continue;

    for (const taskDef of tasksForColumn) {
      // Upsert by columnId + position (unique constraint on schema)
      const task = await db.task.upsert({
        where: {
          columnId_position: { columnId: column.id, position: taskDef.position },
        },
        create: {
          columnId: column.id,
          boardId,
          title: taskDef.title,
          description: taskDef.description,
          priority: taskDef.priority,
          position: taskDef.position,
          labels: taskDef.labels,
        },
        update: {
          title: taskDef.title,
          description: taskDef.description,
          priority: taskDef.priority,
          labels: taskDef.labels,
        },
      });

      console.log(
        `  ✅  Task: "${task.title}" [${column.name}, pos: ${task.position}]`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌱  Starting Apex Dashboard database seed…\n');

  // 1. Guest user
  const guestUser = await seedGuestUser();

  // 2. Workspace (owned by guest for simplicity in the demo)
  const workspace = await seedWorkspace(guestUser.id);

  // 3. WorkspaceMember — guest as MEMBER (owner relation is separate)
  await seedWorkspaceMember(workspace.id, guestUser.id);

  // 4. Board
  const board = await seedBoard(workspace.id);

  // 5. Columns
  const columns = await seedColumns(board.id);

  // 6. Tasks (3 per column)
  await seedTasks(board.id, columns);

  console.log('\n🎉  Seed complete!\n');
  console.log('Next steps:');
  console.log(
    '  1. Create the Clerk account for guest@apex-demo.com via the Clerk Dashboard.',
  );
  console.log(
    '  2. Set GUEST_CLERK_ID=<clerk_user_id> and GUEST_USER_PASSWORD=<password> in your .env.',
  );
  console.log('  3. Re-run `npx prisma db seed` to update the clerkId field.');
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
