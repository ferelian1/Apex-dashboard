import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db/prisma';

// Clerk webhook event payload types
interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
}

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Read Svix signature headers
  const headerPayload = headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing Svix headers', { status: 400 });
  }

  // Read raw body for signature verification
  const body = await req.text();

  const wh = new Webhook(webhookSecret);
  let payload: ClerkWebhookEvent;

  try {
    payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Invalid Svix signature:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Handle user.created and user.updated events
  if (payload.type === 'user.created' || payload.type === 'user.updated') {
    const { id: clerkId, email_addresses, first_name, last_name, image_url } = payload.data;

    const primaryEmail = email_addresses?.[0]?.email_address;
    if (!primaryEmail) {
      console.error('No email address found in Clerk webhook payload for clerkId:', clerkId);
      return new Response('Missing email address in payload', { status: 400 });
    }

    const name = [first_name, last_name].filter(Boolean).join(' ').trim() || null;
    const image = image_url || null;

    try {
      await db.user.upsert({
        where: { clerkId },
        create: {
          clerkId,
          email: primaryEmail,
          name,
          image,
        },
        update: {
          email: primaryEmail,
          name,
          image,
        },
      });
    } catch (err: unknown) {
      // Handle Prisma P2002 unique constraint violation (duplicate clerkId or email)
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        console.warn('Duplicate clerkId or email encountered (P2002), treating as idempotent:', clerkId);
        return new Response('OK', { status: 200 });
      }

      console.error('Database error while upserting user:', err);
      return new Response('Database error', { status: 500 });
    }
  }

  return new Response('OK', { status: 200 });
}
