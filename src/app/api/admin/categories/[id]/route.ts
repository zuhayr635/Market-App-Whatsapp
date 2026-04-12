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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = params
    const category = await db.category.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { products: true } } },
        },
        _count: { select: { products: true } },
      },
    })
    if (!category) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 })
    }
    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = params
    const body = await req.json()
    const data = categorySchema.parse(body)

    let slug = data.slug || generateSlug(data.name)
    const existing = await db.category.findUnique({ where: { slug } })
    if (existing && existing.id !== id) slug = `${slug}-${Date.now()}`

    const category = await db.category.update({
      where: { id },
      data: { ...data, slug, parentId: data.parentId || null },
    })
    return NextResponse.json(category)
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: (error as { issues: unknown }).issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = params

    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: { select: { children: true, products: true } },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 })
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: "Bu kategorinin alt kategorileri var. Önce alt kategorileri silin." },
        { status: 400 }
      )
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { error: "Bu kategoriye bağlı ürünler var. Önce ürünleri kaldırın." },
        { status: 400 }
      )
    }

    await db.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
