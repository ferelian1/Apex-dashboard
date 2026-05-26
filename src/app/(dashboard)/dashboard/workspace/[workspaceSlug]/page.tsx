/**
 * Board list page — maps to /dashboard/workspace/[workspaceSlug]
 *
 * Requirements: 1.5, 9.4
 */

import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/prisma';

interface WorkspacePageProps {
  params: { workspaceSlug: string };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const workspace = await db.workspace.findUnique({
    where: { slug: params.workspaceSlug },
    include: {
      boards: { orderBy: { createdAt: 'asc' } },
      members: { where: { userId: user.id } },
    },
  });

  if (!workspace || workspace.members.length === 0) notFound();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {workspace.name}
      </h1>
      {workspace.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {workspace.description}
        </p>
      )}

      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Boards
      </h2>

      {workspace.boards.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No boards yet. Create one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspace.boards.map((board) => (
            <Link
              key={board.id}
              href={`/dashboard/workspace/${workspace.slug}/board/${board.id}`}
              className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-primary-400 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {board.name}
              </h3>
              {board.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {board.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
