import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = createPrismaClient()
    return Reflect.get(client, prop, client)
  },
})
