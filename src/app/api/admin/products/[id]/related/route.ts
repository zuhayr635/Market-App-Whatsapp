import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

// GET — list related products for a product
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const { id } = await params
    const related = await db.relatedProduct.findMany({
      where: { productId: id },
      include: {
        related: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(related)
  } catch {
    return NextResponse.json(
      { error: "İlgili ürünler yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// POST — add a related product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { relatedId } = body

    if (!relatedId) {
      return NextResponse.json({ error: "relatedId gerekli" }, { status: 400 })
    }

    if (relatedId === id) {
      return NextResponse.json(
        { error: "Bir ürün kendisiyle ilişkilendirilemez" },
        { status: 400 }
      )
    }

    // Check it doesn't already exist
    const existing = await db.relatedProduct.findUnique({
      where: { productId_relatedId: { productId: id, relatedId } },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Bu ilişki zaten mevcut" },
        { status: 409 }
      )
    }

    const record = await db.relatedProduct.create({
      data: {
        productId: id,
        relatedId,
      },
      include: {
        related: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, altText: true } },
          },
        },
      },
    })

    return NextResponse.json(record)
  } catch {
    return NextResponse.json(
      { error: "İlgili ürün eklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// DELETE — remove a related product (?relatedId=xxx)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const relatedId = searchParams.get("relatedId")

    if (!relatedId) {
      return NextResponse.json(
        { error: "relatedId parametresi gerekli" },
        { status: 400 }
      )
    }

    const record = await db.relatedProduct.findUnique({
      where: { productId_relatedId: { productId: id, relatedId } },
    })

    if (!record) {
      return NextResponse.json(
        { error: "İlgili ürün ilişkisi bulunamadı" },
        { status: 404 }
      )
    }

    await db.relatedProduct.delete({
      where: { productId_relatedId: { productId: id, relatedId } },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "İlgili ürün kaldırılırken hata oluştu" },
      { status: 500 }
    )
  }
}
