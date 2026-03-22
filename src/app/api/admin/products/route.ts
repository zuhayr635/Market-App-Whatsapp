import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ProductStatus, Prisma } from "@/generated/prisma"
import { generateSlug } from "@/lib/utils/slug"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const status = searchParams.get("status") || ""
    const sort = searchParams.get("sort") || "newest"

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
            take: 1,
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
  try {
    const body = await request.json()
    const { name, sku, categoryId, priceUsd, priceTl, stockQty, shortDesc, status } = body

    if (!name || !priceUsd || !priceTl) {
      return NextResponse.json(
        { error: "Ürün adı, USD fiyat ve TL fiyat zorunludur" },
        { status: 400 }
      )
    }

    // Generate slug, ensure unique
    let slug = generateSlug(name)
    const existingSlug = await db.product.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // Auto-generate SKU if not provided
    const finalSku = sku && sku.trim() ? sku.trim() : `PRD-${Date.now()}`

    // Check SKU uniqueness
    const existingSku = await db.product.findUnique({ where: { sku: finalSku } })
    if (existingSku) {
      return NextResponse.json(
        { error: "Bu SKU zaten kullanılıyor" },
        { status: 400 }
      )
    }

    // Validate status
    const productStatus =
      status && Object.values(ProductStatus).includes(status as ProductStatus)
        ? (status as ProductStatus)
        : ProductStatus.DRAFT

    const product = await db.product.create({
      data: {
        name,
        slug,
        sku: finalSku,
        priceUsd: new Prisma.Decimal(priceUsd),
        priceTl: new Prisma.Decimal(priceTl),
        stockQty: stockQty ? parseInt(stockQty) : 0,
        shortDesc: shortDesc || null,
        status: productStatus,
        ...(categoryId
          ? {
              categories: {
                create: { categoryId },
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
