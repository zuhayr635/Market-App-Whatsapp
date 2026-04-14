export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await db.product.findUnique({
    where: { slug },
    select: {
      id: true,
      categories: { select: { categoryId: true }, take: 1 },
    },
  })
  if (!product) return NextResponse.json([])

  // First: manually linked related products
  const linked = await db.relatedProduct.findMany({
    where: { productId: product.id },
    include: {
      related: {
        select: {
          id: true, name: true, slug: true, priceUsd: true, priceTl: true,
          status: true,
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
    take: 8,
  })

  const linkedProducts = linked
    .filter((r) => r.related.status === "PUBLISHED")
    .map((r) => r.related)

  if (linkedProducts.length >= 4) {
    return NextResponse.json(linkedProducts.slice(0, 8))
  }

  // Fallback: same-category products
  const linkedIds = new Set(linkedProducts.map((p) => p.id))
  linkedIds.add(product.id)

  const needed = 8 - linkedProducts.length
  const firstCategoryId = product.categories[0]?.categoryId

  const sameCat = firstCategoryId
    ? await db.product.findMany({
        where: {
          status: "PUBLISHED",
          id: { notIn: Array.from(linkedIds) },
          categories: { some: { categoryId: firstCategoryId } },
        },
        select: {
          id: true, name: true, slug: true, priceUsd: true, priceTl: true,
          status: true,
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } },
        },
        take: needed,
        orderBy: { createdAt: "desc" },
      })
    : []

  return NextResponse.json([...linkedProducts, ...sameCat])
}
