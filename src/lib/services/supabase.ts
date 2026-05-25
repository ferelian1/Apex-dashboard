/**
 * Supabase client singleton for Realtime subscriptions.
 *
 * This client is used ONLY for Supabase Realtime (WebSocket) subscriptions
 * that broadcast Postgres change events to connected board clients.
 * All database queries and mutations go through Prisma (src/lib/db/prisma.ts).
 *
 * Uses the public anon key — safe for client-side use since Supabase RLS
 * policies control data access at the database level.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.',
  );
}

/**
 * Singleton Supabase client.
 * Import this wherever Realtime channel subscriptions are needed.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
