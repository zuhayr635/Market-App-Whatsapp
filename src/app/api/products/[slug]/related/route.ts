export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await db.product.findUnique({ where: { slug }, select: { id: true } })
  if (!product) return NextResponse.json([])

  const related = await db.relatedProduct.findMany({
    where: { productId: product.id },
    include: {
      related: {
        select: {
          id: true, name: true, slug: true, priceUsd: true, priceTl: true,
          status: true,
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } }
        }
      }
    },
    orderBy: { sortOrder: "asc" },
    take: 8,
  })

  return NextResponse.json(related.filter(r => r.related.status === "PUBLISHED").map(r => r.related))
}
