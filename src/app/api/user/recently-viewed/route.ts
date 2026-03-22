import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json()
  const { productId } = body

  if (!productId) {
    return NextResponse.json({ error: "productId gerekli" }, { status: 400 })
  }

  // Upsert: update viewedAt if exists, otherwise create
  await db.recentlyViewed.upsert({
    where: { userId_productId: { userId, productId } },
    update: { viewedAt: new Date() },
    create: { userId, productId },
  })

  // Limit to last 20: delete oldest records beyond 20
  const allRecords = await db.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    select: { id: true },
  })

  if (allRecords.length > 20) {
    const toDelete = allRecords.slice(20).map((r) => r.id)
    await db.recentlyViewed.deleteMany({
      where: { id: { in: toDelete } },
    })
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }

  const userId = session.user.id

  const data = await db.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: 10,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          priceUsd: true,
          priceTl: true,
          images: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: { url: true, altText: true },
          },
        },
      },
    },
  })

  return NextResponse.json({ products: data.map((rv) => rv.product) })
}
