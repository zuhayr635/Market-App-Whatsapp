import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

// GET — list product images ordered by sortOrder
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = await params
    const images = await db.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(images)
  } catch {
    return NextResponse.json(
      { error: "Görseller yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// POST — add image to product
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
    const { url, altText, title, description, isFeatured } = body

    if (!url) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 })
    }

    // Get current max sortOrder
    const lastImage = await db.productImage.findFirst({
      where: { productId: id },
      orderBy: { sortOrder: "desc" },
    })
    const nextOrder = (lastImage?.sortOrder ?? -1) + 1

    // If setting as featured, unset others
    if (isFeatured) {
      await db.productImage.updateMany({
        where: { productId: id, isFeatured: true },
        data: { isFeatured: false },
      })
    }

    const image = await db.productImage.create({
      data: {
        productId: id,
        url,
        altText: altText || null,
        title: title || null,
        description: description || null,
        sortOrder: nextOrder,
        isFeatured: isFeatured || nextOrder === 0, // First image is featured by default
      },
    })

    return NextResponse.json(image)
  } catch {
    return NextResponse.json(
      { error: "Görsel eklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// PUT — bulk update images (reorder, featured, alt texts)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const { images } = body as {
      images: Array<{
        id: string
        sortOrder: number
        isFeatured: boolean
        altText?: string | null
        title?: string | null
        description?: string | null
      }>
    }

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: "images dizisi gerekli" },
        { status: 400 }
      )
    }

    // Update each image
    await Promise.all(
      images.map((img) =>
        db.productImage.update({
          where: { id: img.id, productId: id },
          data: {
            sortOrder: img.sortOrder,
            isFeatured: img.isFeatured,
            altText: img.altText ?? null,
            title: img.title ?? null,
            description: img.description ?? null,
          },
        })
      )
    )

    const updated = await db.productImage.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json(
      { error: "Görseller güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// DELETE — delete an image
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
    const imageId = searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json(
        { error: "imageId parametresi gerekli" },
        { status: 400 }
      )
    }

    const image = await db.productImage.findFirst({
      where: { id: imageId, productId: id },
    })

    if (!image) {
      return NextResponse.json(
        { error: "Görsel bulunamadı" },
        { status: 404 }
      )
    }

    // Delete record
    await db.productImage.delete({ where: { id: imageId } })

    // If it was featured, make the first remaining image featured
    if (image.isFeatured) {
      const firstImage = await db.productImage.findFirst({
        where: { productId: id },
        orderBy: { sortOrder: "asc" },
      })
      if (firstImage) {
        await db.productImage.update({
          where: { id: firstImage.id },
          data: { isFeatured: true },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Görsel silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
