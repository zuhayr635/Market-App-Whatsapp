import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const session = await auth()
    const isLoggedIn = !!session?.user

    const product = await db.product.findUnique({
      where: { slug },
      include: {
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                parent: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
        images: {
          orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        },
        videos: {
          orderBy: { sortOrder: "asc" },
        },
        files: true,
        links: {
          orderBy: { sortOrder: "asc" },
        },
        attributes: {
          include: {
            attributeType: { select: { id: true, name: true, slug: true } },
          },
        },
        tabs: {
          where: { status: true },
          orderBy: { sortOrder: "asc" },
        },
        tags: {
          include: {
            tag: { select: { id: true, name: true, slug: true } },
          },
        },
        variations: {
          where: { status: true },
        },
        relatedFrom: {
          include: {
            related: {
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
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      )
    }

    // Check if published
    if (product.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      )
    }

    // Check visibility
    if (product.visibility === "MEMBERS_ONLY" && !isLoggedIn) {
      return NextResponse.json(
        { error: "Bu ürünü görüntülemek için giriş yapmanız gerekiyor" },
        { status: 403 }
      )
    }

    if (product.visibility === "PASSWORD_PROTECTED") {
      return NextResponse.json(
        { error: "Bu ürün şifre korumalıdır" },
        { status: 403 }
      )
    }

    // Increment view count (fire and forget)
    db.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {})

    // Get variation types for rendering
    const variationTypes = await db.variationType.findMany({
      where: { status: true },
      include: {
        values: {
          where: { status: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    // Filter related products to only published ones
    const relatedProducts = product.relatedFrom
      .map((r) => r.related)
      .filter((p) => p.status === "PUBLISHED")
      .map((p) => ({
        ...p,
        priceUsd: Number(p.priceUsd),
        priceTl: Number(p.priceTl),
        salePriceUsd: p.salePriceUsd ? Number(p.salePriceUsd) : null,
        salePriceTl: p.salePriceTl ? Number(p.salePriceTl) : null,
      }))

    return NextResponse.json({
      ...product,
      priceUsd: Number(product.priceUsd),
      priceTl: Number(product.priceTl),
      salePriceUsd: product.salePriceUsd ? Number(product.salePriceUsd) : null,
      salePriceTl: product.salePriceTl ? Number(product.salePriceTl) : null,
      weight: product.weight ? Number(product.weight) : null,
      width: product.width ? Number(product.width) : null,
      height: product.height ? Number(product.height) : null,
      depth: product.depth ? Number(product.depth) : null,
      variations: product.variations.map((v) => ({
        ...v,
        priceDiff: v.priceDiff ? Number(v.priceDiff) : null,
        salePrice: v.salePrice ? Number(v.salePrice) : null,
        weight: v.weight ? Number(v.weight) : null,
      })),
      relatedProducts,
      variationTypes,
    })
  } catch (error) {
    console.error("Product detail GET error:", error)
    return NextResponse.json(
      { error: "Ürün yüklenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
