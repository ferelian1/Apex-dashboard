/**
 * Workspace list page — maps to /dashboard
 *
 * Requirements: 1.5
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/prisma';

// Force dynamic rendering — this page queries the database per request
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: { _count: { select: { boards: true } } },
      },
    },
  });

  const workspaces = memberships.map((m) => m.workspace);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Your Workspaces
      </h1>

      {workspaces.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No workspaces yet. Create one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/workspace/${ws.slug}`}
              className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-primary-400 hover:shadow-md transition-all"
            >
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {ws.name}
              </h2>
              {ws.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {ws.description}
                </p>
              )}
              <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                {ws._count.boards} board{ws._count.boards !== 1 ? 's' : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
