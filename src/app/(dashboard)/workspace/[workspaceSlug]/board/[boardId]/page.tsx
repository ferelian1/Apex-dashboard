/**
 * Kanban board page — Server Component.
 *
 * Fetches BoardWithColumnsAndTasks server-side, authorizes via
 * requireWorkspaceMember, then dynamically imports BoardView with ssr:false
 * to prevent hydration errors from dnd-kit's browser-only APIs.
 *
 * Requirements: 13.5
 */

import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { db } from '@/lib/db/prisma';
import { getBoardWithColumnsAndTasks } from '@/lib/db/board';
import { requireWorkspaceMember } from '@/lib/services/clerk';
import { BoardSkeleton } from '@/components/shared/LoadingSkeleton';

// Dynamic import with ssr:false — prevents hydration errors from dnd-kit (Req 13.5)
const BoardView = dynamic(
  () => import('@/components/kanban/BoardView'),
  {
    ssr: false,
    loading: () => <BoardSkeleton />,
  },
);

interface BoardPageProps {
  params: {
    workspaceSlug: string;
    boardId: string;
  };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Resolve DB user
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  // Resolve workspace for authorization
  const workspace = await db.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    select: { id: true },
  });
  if (!workspace) notFound();

  // Authorization check — throws UnauthorizedError if not a member
  try {
    await requireWorkspaceMember(workspace.id, userId);
  } catch {
    notFound();
  }

  // Fetch board with all columns and tasks
  const board = await getBoardWithColumnsAndTasks(params.boardId, user.id);
  if (!board) notFound();

  const isGuest = user.email === 'guest@apex-demo.com';

  return (
    <div className="h-full">
      <BoardView
        board={board}
        workspaceId={workspace.id}
        currentUserId={user.id}
        isGuest={isGuest}
      />
    </div>
  );
}
