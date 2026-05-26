import { PrismaClient } from '@prisma/client';

const isDev = process.env.NODE_ENV !== 'production';

// Use a global symbol so the instance survives hot-reloads in dev
// AND is reused across invocations in the same Lambda container in production.
const prismaSymbol = Symbol.for('prisma.client');

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return new PrismaClient({
    log: isDev ? ['warn', 'error'] : ['error'],
    // Limit connections — critical for serverless to avoid exhausting PgBouncer
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Store on globalThis so the same instance is reused across:
// - Hot-reloads in development
// - Multiple requests in the same warm Lambda container in production
const globalWithPrisma = globalThis as typeof globalThis & {
  [prismaSymbol]?: PrismaClient;
};

if (!globalWithPrisma[prismaSymbol]) {
  globalWithPrisma[prismaSymbol] = createPrismaClient();
}

export const db = globalWithPrisma[prismaSymbol];
