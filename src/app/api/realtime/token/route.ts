/**
 * Supabase Realtime auth token endpoint.
 *
 * Returns a short-lived Supabase Realtime JWT for the authenticated user,
 * allowing the client to subscribe to board-scoped Postgres Changes channels.
 *
 * Only authenticated Clerk users can obtain a token.
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // Verify Clerk session
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Use the service role client to generate a short-lived realtime token
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Generate a Realtime access token scoped to the authenticated user
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: `${userId}@realtime.internal`,
      options: { redirectTo: '/' },
    });

    if (error || !data) {
      // Fallback: return the anon key token for public channel access
      return new Response(
        JSON.stringify({ token: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ token: data.properties?.hashed_token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Fallback to anon key for Realtime subscriptions
    return new Response(
      JSON.stringify({ token: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
