import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

// GET: fetch all value images for a product
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session?.user || (session.user as any).type !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { id: productId } = await params
    const images = await db.productVariationValueImage.findMany({
      where: { productId },
    })
    return NextResponse.json(images)
  } catch (_error) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

// POST: upsert a value image for a product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session?.user || (session.user as any).type !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { id: productId } = await params
    const { variationValueId, imageUrl } = await req.json()

    if (!variationValueId || !imageUrl) {
      return NextResponse.json({ error: "variationValueId ve imageUrl zorunlu" }, { status: 400 })
    }

    const record = await db.productVariationValueImage.upsert({
      where: { productId_variationValueId: { productId, variationValueId } },
      create: { productId, variationValueId, imageUrl },
      update: { imageUrl },
    })
    return NextResponse.json(record)
  } catch (_error) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

// DELETE: remove a value image
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session?.user || (session.user as any).type !== "admin") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    const { id: productId } = await params
    const { variationValueId } = await req.json()

    if (!variationValueId) {
      return NextResponse.json({ error: "variationValueId zorunlu" }, { status: 400 })
    }

    await db.productVariationValueImage.deleteMany({
      where: { productId, variationValueId },
    })
    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
