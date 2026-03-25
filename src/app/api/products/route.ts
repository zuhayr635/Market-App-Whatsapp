export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { Prisma } from "@/generated/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(60, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const search = searchParams.get("search") || ""
    const categorySlug = searchParams.get("categorySlug") || ""
    const minPrice = searchParams.get("minPrice") || ""
    const maxPrice = searchParams.get("maxPrice") || ""
    const brandId = searchParams.get("brandId") || ""
    const sort = searchParams.get("sort") || "newest"
    const inStock = searchParams.get("inStock")

    // Only PUBLISHED + PUBLIC products
    const where: Prisma.ProductWhereInput = {
      status: "PUBLISHED",
      visibility: "PUBLIC",
    }

    // Search
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortDesc: { contains: search } },
        { sku: { contains: search } },
      ]
    }

    // Category filter
    if (categorySlug) {
      // Find the category and all its children
      const category = await db.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true, children: { select: { id: true } } },
      })
      if (category) {
        const categoryIds = [category.id, ...category.children.map((c) => c.id)]
        where.categories = {
          some: { categoryId: { in: categoryIds } },
        }
      }
    }

    // Price filter (USD)
    if (minPrice || maxPrice) {
      where.priceUsd = {}
      if (minPrice) {
        where.priceUsd.gte = new Prisma.Decimal(minPrice)
      }
      if (maxPrice) {
        where.priceUsd.lte = new Prisma.Decimal(maxPrice)
      }
    }

    // Brand filter
    if (brandId) {
      where.brandId = brandId
    }

    // In stock filter
    if (inStock === "true") {
      where.stockQty = { gt: 0 }
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" }
    switch (sort) {
      case "price_asc":
        orderBy = { priceUsd: "asc" }
        break
      case "price_desc":
        orderBy = { priceUsd: "desc" }
        break
      case "popular":
        orderBy = { viewCount: "desc" }
        break
      case "name_asc":
        orderBy = { name: "asc" }
        break
      case "name_desc":
        orderBy = { name: "desc" }
        break
      default:
        orderBy = { createdAt: "desc" }
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          categories: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          images: {
            take: 1,
            orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
            select: { id: true, url: true, altText: true },
          },
        },
      }),
      db.product.count({ where }),
    ])

    // Get filter options (active categories, brands, price range) for published products
    const baseWhere: Prisma.ProductWhereInput = {
      status: "PUBLISHED",
      visibility: "PUBLIC",
    }

    const [filterCategories, filterBrands, priceAgg] = await Promise.all([
      db.category.findMany({
        where: {
          status: true,
          products: { some: { product: baseWhere } },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          _count: { select: { products: { where: { product: baseWhere } } } },
        },
        orderBy: { sortOrder: "asc" },
      }),
      db.brand.findMany({
        where: {
          status: true,
          products: { some: baseWhere },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: { where: baseWhere } } },
        },
        orderBy: { name: "asc" },
      }),
      db.product.aggregate({
        where: baseWhere,
        _min: { priceUsd: true },
        _max: { priceUsd: true },
      }),
    ])

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        priceUsd: Number(p.priceUsd),
        priceTl: Number(p.priceTl),
        salePriceUsd: p.salePriceUsd ? Number(p.salePriceUsd) : null,
        salePriceTl: p.salePriceTl ? Number(p.salePriceTl) : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        categories: filterCategories,
        brands: filterBrands,
        priceRange: {
          min: priceAgg._min.priceUsd ? Number(priceAgg._min.priceUsd) : 0,
          max: priceAgg._max.priceUsd ? Number(priceAgg._max.priceUsd) : 0,
        },
      },
    })
  } catch (error) {
    console.error("Products public GET error:", error)
    return NextResponse.json(
      { error: "Ürünler yüklenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
