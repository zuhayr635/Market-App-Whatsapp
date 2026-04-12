import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { categorySchema } from "@/lib/validations/category"
import { generateSlug } from "@/lib/utils/slug"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    // Fetch all categories flat, then build tree (supports unlimited depth)
    const all = await db.category.findMany({
      include: { _count: { select: { products: true } } },
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

    return NextResponse.json(roots)
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
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
