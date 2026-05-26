/**
 * Dashboard shell layout — maps to /dashboard/*
 *
 * Wraps all dashboard pages with Navbar, Sidebar, and DemoModeBanner.
 * Fetches the current user's workspaces (with boards) server-side for the sidebar.
 *
 * Requirements: 1.5, 9.1, 9.2
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/prisma';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import DemoModeBanner from '@/components/shared/DemoModeBanner';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) redirect('/sign-in');

  const memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          boards: { orderBy: { createdAt: 'asc' } },
        },
      },
    },
  });

  const workspaces = memberships.map((m) => m.workspace);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DemoModeBanner />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar workspaces={workspaces} />
        </div>
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
