export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const favorites = await db.favorite.findMany({
    where: { userId: session.user.id },
    include: { product: { select: { id: true, name: true, slug: true, priceUsd: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(favorites)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: "productId gerekli" }, { status: 400 })

  const existing = await db.favorite.findFirst({
    where: { userId: session.user.id, productId },
  })

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }

  await db.favorite.create({
    data: { userId: session.user.id, productId },
  })
  return NextResponse.json({ favorited: true })
}
