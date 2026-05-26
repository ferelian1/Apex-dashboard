/**
 * Kanban board page — maps to /dashboard/workspace/[workspaceSlug]/board/[boardId]
 *
 * Requirements: 13.5
 */

import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import { db } from '@/lib/db/prisma';
import { getBoardWithColumnsAndTasks } from '@/lib/db/board';
import { requireWorkspaceMember } from '@/lib/services/clerk';
import { BoardSkeleton } from '@/components/shared/LoadingSkeleton';

// Force dynamic rendering — this page queries the database per request
export const dynamic = 'force-dynamic';

const BoardView = nextDynamic(
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

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const workspace = await db.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    select: { id: true },
  });
  if (!workspace) notFound();

  try {
    await requireWorkspaceMember(workspace.id, userId);
  } catch {
    notFound();
  }

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
