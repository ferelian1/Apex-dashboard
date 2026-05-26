'use client';

/**
 * Subscribes to Supabase Realtime Postgres Changes for a specific board.
 * Gracefully no-ops if Supabase is not configured.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/services/supabase';

export function useRealtime(boardId: string) {
  const router = useRouter();

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return; // Supabase not configured — skip Realtime

    const channel = client
      .channel(`board:${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Task' }, () =>
        router.refresh(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Column' }, () =>
        router.refresh(),
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [boardId, router]);
}
