import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Production'da da global'e bağla — container'da tek process vardır
globalForPrisma.prisma = db
