import { PrismaClient } from '@prisma/client';

const isDev = process.env.NODE_ENV !== 'production';

// Unique symbol key for storing the singleton on globalThis in development
const prismaSymbol = Symbol.for('prisma.client');

function createPrismaClient(): PrismaClient {
  // Validate at instantiation time (runtime), not at module load time (build time).
  // This prevents Next.js static analysis from failing during `next build`
  // when DATABASE_URL is not available in the build environment.
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return new PrismaClient({
    log: isDev ? ['query', 'info', 'warn'] : ['error'],
  });
}

let db: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production, always create a fresh instance (no global cache needed)
  db = createPrismaClient();
} else {
  // In development, reuse the instance stored on globalThis to survive hot-reloads
  const globalWithPrisma = globalThis as typeof globalThis & {
    [prismaSymbol]?: PrismaClient;
  };

  if (!globalWithPrisma[prismaSymbol]) {
    globalWithPrisma[prismaSymbol] = createPrismaClient();
  }

  db = globalWithPrisma[prismaSymbol];
}

export { db };
