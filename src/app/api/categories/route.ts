export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const baseWhere = {
      status: "PUBLISHED" as const,
      visibility: "PUBLIC" as const,
    }

    const categories = await db.category.findMany({
      where: { status: true },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        description: true,
        parentId: true,
        sortOrder: true,
        _count: {
          select: {
            products: {
              where: { product: baseWhere },
            },
          },
        },
        children: {
          where: { status: true },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            description: true,
            parentId: true,
            sortOrder: true,
            _count: {
              select: {
                products: {
                  where: { product: baseWhere },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    // Return only top-level categories (parentId is null) with children nested
    const tree = categories.filter((c) => !c.parentId)

    return NextResponse.json({ categories: tree })
  } catch (error) {
    console.error("Categories public GET error:", error)
    return NextResponse.json(
      { error: "Kategoriler yüklenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
