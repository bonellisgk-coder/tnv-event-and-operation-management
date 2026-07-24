import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres.liwnracionvrkwztqytv:tamilnadu%40123@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});
