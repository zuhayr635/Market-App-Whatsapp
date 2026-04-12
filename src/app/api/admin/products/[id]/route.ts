import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { ProductStatus, Prisma } from "@/generated/prisma"
import { generateSlug } from "@/lib/utils/slug"
import { productSchema } from "@/lib/validations/product"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = params
    const body = await request.json()

    // Check product exists
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      )
    }

    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message)
      return NextResponse.json(
        { error: errors.join(", "), issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Handle slug
    let slug = data.slug && data.slug.trim() ? data.slug.trim() : generateSlug(data.name)
    if (slug !== existing.slug) {
      const existingSlug = await db.product.findUnique({ where: { slug } })
      if (existingSlug && existingSlug.id !== id) {
        slug = `${slug}-${Date.now()}`
      }
    }

    // Handle SKU
    const sku = data.sku && data.sku.trim() ? data.sku.trim() : existing.sku
    if (sku !== existing.sku) {
      const existingSku = await db.product.findUnique({ where: { sku } })
      if (existingSku && existingSku.id !== id) {
        return NextResponse.json(
          { error: "Bu SKU zaten kullanılıyor" },
          { status: 400 }
        )
      }
    }

    const priceTl = data.priceTl ?? data.priceUsd

    // Use transaction to update product and relations
    const product = await db.$transaction(async (tx) => {
      // Update category relations: delete old, create new
      if (data.categoryIds !== undefined) {
        await tx.productCategory.deleteMany({ where: { productId: id } })
        if (data.categoryIds && data.categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: data.categoryIds.map((categoryId) => ({
              productId: id,
              categoryId,
            })),
          })
        }
      }

      // Update tag relations: delete old, create new
      if (data.tagIds !== undefined) {
        await tx.productTag.deleteMany({ where: { productId: id } })
        if (data.tagIds && data.tagIds.length > 0) {
          await tx.productTag.createMany({
            data: data.tagIds.map((tagId) => ({
              productId: id,
              tagId,
            })),
          })
        }
      }

      // Update the product
      return tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug,
          sku,
          shortDesc: data.shortDesc || null,
          fullDesc: data.fullDesc || null,
          barcode: data.barcode || null,
          brandId: data.brandId || null,
          manufacturer: data.manufacturer || null,
          originCountry: data.originCountry || null,
          priceUsd: new Prisma.Decimal(data.priceUsd),
          priceTl: new Prisma.Decimal(priceTl),
          salePriceUsd: data.salePriceUsd != null ? new Prisma.Decimal(data.salePriceUsd) : null,
          salePriceTl: data.salePriceTl != null ? new Prisma.Decimal(data.salePriceTl) : null,
          saleStart: data.saleStart ? new Date(data.saleStart) : null,
          saleEnd: data.saleEnd ? new Date(data.saleEnd) : null,
          vatRate: data.vatRate ?? 18,
          vatIncluded: data.vatIncluded ?? true,
          stockTracking: data.stockTracking ?? true,
          stockQty: data.stockQty ?? 0,
          lowStockThreshold: data.lowStockThreshold ?? 5,
          weight: data.weight != null ? new Prisma.Decimal(data.weight) : null,
          width: data.width != null ? new Prisma.Decimal(data.width) : null,
          height: data.height != null ? new Prisma.Decimal(data.height) : null,
          depth: data.depth != null ? new Prisma.Decimal(data.depth) : null,
          isFeatured: data.isFeatured ?? false,
          isNew: data.isNew ?? false,
          isBestSeller: data.isBestSeller ?? false,
          seoTitle: data.seoTitle || null,
          seoDesc: data.seoDesc || null,
          status: (data.status as ProductStatus) || ProductStatus.DRAFT,
          visibility: data.visibility || "PUBLIC",
          publishAt: data.publishAt ? new Date(data.publishAt) : null,
          sortOrder: data.sortOrder ?? 0,
        },
        include: {
          categories: {
            include: {
              category: { select: { id: true, name: true } },
            },
          },
          tags: {
            include: {
              tag: { select: { id: true, name: true } },
            },
          },
        },
      })
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product PUT error:", error)
    return NextResponse.json(
      { error: "Ürün güncellenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = params
    const body = await request.json()
    const { priceUsd, priceTl, stockQty, status } = body

    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (priceUsd !== undefined) updateData.priceUsd = new Prisma.Decimal(priceUsd)
    if (priceTl !== undefined) updateData.priceTl = new Prisma.Decimal(priceTl)
    if (stockQty !== undefined) updateData.stockQty = parseInt(String(stockQty), 10)
    if (status !== undefined && Object.values(ProductStatus).includes(status as ProductStatus)) {
      updateData.status = status as ProductStatus
    }

    const updated = await db.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Product PATCH error:", error)
    return NextResponse.json(
      { error: "Ürün güncellenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
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
