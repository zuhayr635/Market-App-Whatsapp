import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function requireAdmin(session: Awaited<ReturnType<typeof auth>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  return null
}

// GET: fetch all value images for a product
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const denied = await requireAdmin(session)
  if (denied) return denied

  const { id: productId } = await params
  const images = await db.productVariationValueImage.findMany({
    where: { productId },
  })
  return NextResponse.json(images)
}

// POST: upsert a value image for a product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const denied = await requireAdmin(session)
  if (denied) return denied

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
}

// DELETE: remove a value image
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const denied = await requireAdmin(session)
  if (denied) return denied

  const { id: productId } = await params
  const { variationValueId } = await req.json()

  if (!variationValueId) {
    return NextResponse.json({ error: "variationValueId zorunlu" }, { status: 400 })
  }

  await db.productVariationValueImage.deleteMany({
    where: { productId, variationValueId },
  })
  return NextResponse.json({ ok: true })
}
