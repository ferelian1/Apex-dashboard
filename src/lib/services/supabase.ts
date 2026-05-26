/**
 * Supabase client singleton for Realtime subscriptions.
 *
 * Used ONLY for Supabase Realtime (WebSocket) subscriptions.
 * All database queries go through Prisma.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Lazy singleton — only created when actually used, not at module load time.
// This prevents client-side crashes when env vars are missing or placeholder values.
let _supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'eyJ...') {
    return null;
  }
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Keep named export for backward compatibility
export const supabase = {
  channel: (name: string) => getSupabaseClient()?.channel(name),
  removeChannel: (channel: ReturnType<SupabaseClient['channel']>) =>
    getSupabaseClient()?.removeChannel(channel),
};
