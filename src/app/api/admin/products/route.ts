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

export async function GET(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const status = searchParams.get("status") || ""
    const sort = searchParams.get("sort") || "newest"
    const allImages = searchParams.get("allImages") === "true"

    const where: Prisma.ProductWhereInput = {}

    // Search by name or SKU
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    // Filter by status
    if (status && Object.values(ProductStatus).includes(status as ProductStatus)) {
      where.status = status as ProductStatus
    }

    // Filter by category
    if (categoryId) {
      where.categories = {
        some: { categoryId },
      }
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" }
    switch (sort) {
      case "oldest":
        orderBy = { createdAt: "asc" }
        break
      case "price_asc":
        orderBy = { priceUsd: "asc" }
        break
      case "price_desc":
        orderBy = { priceUsd: "desc" }
        break
      case "name":
        orderBy = { name: "asc" }
        break
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brand: { select: { id: true, name: true } },
          categories: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          images: {
            ...(allImages ? {} : { take: 1 }),
            orderBy: { sortOrder: "asc" },
            select: { id: true, url: true, altText: true },
          },
          _count: {
            select: { variations: true },
          },
        },
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Products GET error:", error)
    return NextResponse.json(
      { error: "Ürünler yüklenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const body = await request.json()
    const parsed = productSchema.safeParse(body)

    if (!parsed.success) {
      const errors = parsed.error.issues.map((i) => i.message)
      return NextResponse.json(
        { error: errors.join(", "), issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Generate slug, ensure unique
    let slug = data.slug && data.slug.trim() ? data.slug.trim() : generateSlug(data.name)
    const existingSlug = await db.product.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // Auto-generate SKU if not provided
    const sku = data.sku && data.sku.trim() ? data.sku.trim() : `PRD-${Date.now()}`

    // Check SKU uniqueness
    const existingSku = await db.product.findUnique({ where: { sku } })
    if (existingSku) {
      return NextResponse.json(
        { error: "Bu SKU zaten kullanılıyor" },
        { status: 400 }
      )
    }

    // Auto-calculate TL price if not provided or zero
    const priceTl = (data.priceTl && data.priceTl > 0) ? data.priceTl : data.priceUsd

    const product = await db.product.create({
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
        // Create category relations
        ...(data.categoryIds && data.categoryIds.length > 0
          ? {
              categories: {
                create: data.categoryIds.map((categoryId) => ({ categoryId })),
              },
            }
          : {}),
        // Create tag relations
        ...(data.tagIds && data.tagIds.length > 0
          ? {
              tags: {
                create: data.tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
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

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Products POST error:", error)
    return NextResponse.json(
      { error: "Ürün oluşturulurken bir hata oluştu" },
      { status: 500 }
    )
  }
}
