// Temporary fix - use any type to bypass TypeScript errors until schema is fixed
const { PrismaClient } = require('@prisma/client');

// Khởi tạo Prisma Client để kết nối với PostgreSQL
// Trong môi trường development, chúng ta sử dụng global variable để tránh tạo quá nhiều connection
const globalForPrisma = global as unknown as { prisma: any };

export const prisma =
  globalForPrisma.prisma ||
  new (PrismaClient as any)({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
