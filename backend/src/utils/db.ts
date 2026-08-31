// Import from the explicitly generated Prisma client location so Vercel can bundle it
import { PrismaClient } from '../generated/prisma';

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres.liwnracionvrkwztqytv:tamilnadu%40123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require";

let _prisma: PrismaClient | null = null;
let _prismaError: Error | null = null;

try {
  _prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
} catch (err: any) {
  _prismaError = err;
  console.error('[db] Failed to initialize PrismaClient:', err?.message || err);
}

// Export a proxy that throws a helpful error if Prisma failed to init
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (_prismaError || !_prisma) {
      throw new Error(`PrismaClient is not available: ${_prismaError?.message || 'initialization failed'}`);
    }
    const value = (_prisma as any)[prop];
    if (typeof value === 'function') {
      return value.bind(_prisma);
    }
    return value;
  },
});

// Also export the type for use elsewhere
export type { PrismaClient };
