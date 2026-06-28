import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Evitar conexões excessivas no hot-reload do desenvolvimento Next.js
  const globalForPrisma = global as unknown as {
    prisma?: PrismaClient;
    pool?: Pool;
  };

  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString });
    globalForPrisma.pool = pool;
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
}

export { prisma };
