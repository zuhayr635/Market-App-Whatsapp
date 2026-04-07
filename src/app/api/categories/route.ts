export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const baseWhere = {
      status: "PUBLISHED" as const,
      visibility: "PUBLIC" as const,
    }

    // Fetch all categories flat, then build full tree (unlimited depth)
    const all = await db.category.findMany({
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
            products: { where: { product: baseWhere } },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    type CatNode = typeof all[number] & { children: CatNode[] }
    const map = new Map<string, CatNode>()
    for (const cat of all) map.set(cat.id, { ...cat, children: [] })

    const roots: CatNode[] = []
    for (const cat of all) {
      const node = map.get(cat.id)!
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node)
      } else {
        roots.push(node)
      }
    }

    return NextResponse.json({ categories: roots })
  } catch (error) {
    console.error("Categories public GET error:", error)
    return NextResponse.json(
      { error: "Kategoriler yüklenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
