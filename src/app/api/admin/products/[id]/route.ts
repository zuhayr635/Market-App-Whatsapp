import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        brand: true,
        categories: {
          include: {
            category: true,
          },
        },
        images: { orderBy: { sortOrder: "asc" } },
        videos: { orderBy: { sortOrder: "asc" } },
        files: true,
        links: { orderBy: { sortOrder: "asc" } },
        attributes: {
          include: { attributeType: true },
        },
        tabs: { orderBy: { sortOrder: "asc" } },
        tags: {
          include: { tag: true },
        },
        variations: true,
        _count: {
          select: {
            variations: true,
            favorites: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product GET error:", error)
    return NextResponse.json(
      { error: "Ürün yüklenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      )
    }

    await db.product.delete({ where: { id } })

    return NextResponse.json({ message: "Ürün başarıyla silindi" })
  } catch (error) {
    console.error("Product DELETE error:", error)
    return NextResponse.json(
      { error: "Ürün silinirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
