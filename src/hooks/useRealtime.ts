'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/services/supabase';

/**
 * Subscribes to Supabase Realtime Postgres Changes for a specific board.
 *
 * Listens on the channel `board:{boardId}` for any INSERT, UPDATE, or DELETE
 * events on the `Task` and `Column` tables. When a change is detected, calls
 * `router.refresh()` to re-fetch the latest server data without a full page
 * reload, keeping all connected clients in sync.
 *
 * The channel is automatically unsubscribed and removed when the component
 * that calls this hook unmounts.
 *
 * @param boardId - The ID of the board to subscribe to. Used to scope the
 *   Realtime channel so only changes relevant to this board trigger a refresh.
 *
 * @example
 * ```tsx
 * 'use client';
 * export function BoardView({ board }: BoardViewProps) {
 *   useRealtime(board.id);
 *   // ...
 * }
 * ```
 */
export function useRealtime(boardId: string) {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Task' },
        () => router.refresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Column' },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, router]);
}
