import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { categorySchema } from "@/lib/validations/category"
import { generateSlug } from "@/lib/utils/slug"

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = categorySchema.parse(body)

    let slug = data.slug || generateSlug(data.name)
    const existing = await db.category.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    const category = await db.category.create({
      data: { ...data, slug, parentId: data.parentId || null },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: (error as { issues: unknown }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
