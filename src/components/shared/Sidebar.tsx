/**
 * Sidebar — workspace and board navigation.
 *
 * Renders a vertical list of workspaces, each collapsible via a <details>
 * element, with their boards listed beneath. The active board is highlighted.
 *
 * Requirements: 1.4, 12.2
 */

import Link from 'next/link';
import type { Workspace, Board } from '@prisma/client';

interface SidebarProps {
  workspaces: (Workspace & { boards: Board[] })[];
  activeBoardId?: string;
}

export default function Sidebar({ workspaces, activeBoardId }: SidebarProps) {
  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto">
      <nav className="p-3 space-y-1">
        {workspaces.map((ws) => (
          <details key={ws.id} open className="group">
            <summary className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 list-none">
              <Link
                href={`/dashboard/workspace/${ws.slug}`}
                className="flex-1 truncate hover:text-primary-600"
              >
                {ws.name}
              </Link>
            </summary>
            <div className="ml-3 mt-0.5 space-y-0.5">
              {ws.boards.map((board) => {
                const isActive = board.id === activeBoardId;
                return (
                  <Link
                    key={board.id}
                    href={`/dashboard/workspace/${ws.slug}/board/${board.id}`}
                    className={`block px-2 py-1 rounded-md text-sm truncate transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {board.name}
                  </Link>
                );
              })}
            </div>
          </details>
        ))}
      </nav>
    </aside>
  );
}
