import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma"

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

    const variations = await db.productVariation.findMany({
      where: { productId: id },
      orderBy: { id: "asc" },
    })

    return NextResponse.json(variations)
  } catch (error) {
    console.error("ProductVariation GET error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id: productId } = params
    const body = await req.json()
    const { variations } = body

    if (!Array.isArray(variations)) {
      return NextResponse.json(
        { error: "Varyasyonlar dizisi gereklidir" },
        { status: 400 }
      )
    }

    // Verify product exists
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      )
    }

    const result = await db.$transaction(async (tx) => {
      // Delete existing variations for this product
      await tx.productVariation.deleteMany({ where: { productId } })

      // Create new variations
      if (variations.length > 0) {
        await tx.productVariation.createMany({
          data: variations.map(
            (v: {
              combination: Record<string, string>
              sku?: string
              priceDiff?: number | null
              salePrice?: number | null
              stock?: number
              weight?: number | null
              imageUrl?: string
              description?: string
              status?: boolean
            }) => ({
              productId,
              combination: v.combination,
              sku: v.sku || null,
              priceDiff:
                v.priceDiff != null
                  ? new Prisma.Decimal(v.priceDiff)
                  : null,
              salePrice:
                v.salePrice != null
                  ? new Prisma.Decimal(v.salePrice)
                  : null,
              stock: v.stock ?? 0,
              weight:
                v.weight != null ? new Prisma.Decimal(v.weight) : null,
              imageUrl: v.imageUrl || null,
              description: v.description || null,
              status: v.status ?? true,
            })
          ),
        })
      }

      return tx.productVariation.findMany({
        where: { productId },
        orderBy: { id: "asc" },
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("ProductVariation POST error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id: productId } = params
    const { searchParams } = new URL(req.url)
    const variationId = searchParams.get("variationId")

    if (variationId) {
      // Delete a specific variation
      const existing = await db.productVariation.findFirst({
        where: { id: variationId, productId },
      })
      if (!existing) {
        return NextResponse.json(
          { error: "Varyasyon bulunamadı" },
          { status: 404 }
        )
      }
      await db.productVariation.delete({ where: { id: variationId } })
      return NextResponse.json({ message: "Varyasyon silindi" })
    } else {
      // Delete all variations for this product
      await db.productVariation.deleteMany({ where: { productId } })
      return NextResponse.json({ message: "Tüm varyasyonlar silindi" })
    }
  } catch (error) {
    console.error("ProductVariation DELETE error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
