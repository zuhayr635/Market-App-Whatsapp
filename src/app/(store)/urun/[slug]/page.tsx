import { Metadata } from "next"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Breadcrumb } from "@/components/store/breadcrumb"
import { ProductCard, type ProductCardData } from "@/components/store/product-card"
import { ProductDetailClient } from "./product-detail-client"
import { getSiteSettings, buildMetadata } from "@/lib/seo"

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await db.product.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
    select: {
      name: true,
      shortDesc: true,
      seoTitle: true,
      seoDesc: true,
      images: {
        take: 1,
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        select: { url: true, altText: true },
      },
    },
  }).catch(() => null)

  if (!product) return { title: "Ürün Bulunamadı" }

  const { siteName } = await getSiteSettings()
  const title = product.seoTitle || product.name
  const description = product.seoDesc || product.shortDesc || ""
  const image = product.images[0]?.url

  return buildMetadata({
    title,
    description,
    path: `/urun/${params.slug}`,
    image,
    siteName,
  })
}

export default async function ProductDetailPage({ params }: Props) {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const product = await db.product.findUnique({
    where: { slug: params.slug },
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

  if (!product || product.status !== "PUBLISHED") {
    notFound()
  }

  // Check visibility
  if (product.visibility === "MEMBERS_ONLY" && !isLoggedIn) {
    notFound()
  }
  if (product.visibility === "PASSWORD_PROTECTED") {
    notFound()
  }

  // Increment view count
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

  // Build breadcrumb
  const firstCategory = product.categories[0]?.category
  const breadcrumbItems = []
  if (firstCategory) {
    if (firstCategory.parent) {
      breadcrumbItems.push({
        label: firstCategory.parent.name,
        href: `/kategori/${firstCategory.parent.slug}`,
      })
    }
    breadcrumbItems.push({
      label: firstCategory.name,
      href: `/kategori/${firstCategory.slug}`,
    })
  }
  breadcrumbItems.push({ label: product.name })

  // Serialize product data for client component
  const serializedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDesc: product.shortDesc,
    fullDesc: product.fullDesc,
    sku: product.sku,
    barcode: product.barcode,
    manufacturer: product.manufacturer,
    originCountry: product.originCountry,
    priceUsd: Number(product.priceUsd),
    priceTl: Number(product.priceTl),
    salePriceUsd: product.salePriceUsd ? Number(product.salePriceUsd) : null,
    salePriceTl: product.salePriceTl ? Number(product.salePriceTl) : null,
    saleStart: product.saleStart?.toISOString() || null,
    saleEnd: product.saleEnd?.toISOString() || null,
    vatRate: product.vatRate,
    stockTracking: product.stockTracking,
    stockQty: product.stockQty,
    lowStockThreshold: product.lowStockThreshold,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    brand: product.brand,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      title: img.title,
      variationId: img.variationId,
    })),
    videos: product.videos,
    files: product.files.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      url: f.url,
      fileSize: f.fileSize,
      downloadable: f.downloadable,
    })),
    links: product.links,
    attributes: product.attributes.map((a) => ({
      id: a.id,
      value: a.value,
      attributeType: a.attributeType,
    })),
    tabs: product.tabs.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      icon: t.icon,
    })),
    tags: product.tags.map((t) => t.tag),
    variations: product.variations.map((v) => ({
      id: v.id,
      combination: v.combination as Record<string, string>,
      priceDiff: v.priceDiff ? Number(v.priceDiff) : null,
      salePrice: v.salePrice ? Number(v.salePrice) : null,
      stock: v.stock,
      imageUrl: v.imageUrl,
      sku: v.sku,
    })),
  }

  const serializedVariationTypes = variationTypes.map((vt) => ({
    id: vt.id,
    name: vt.name,
    displayType: vt.displayType,
    sortOrder: vt.sortOrder,
    values: vt.values.map((val) => ({
      id: val.id,
      variationTypeId: val.variationTypeId,
      value: val.value,
      colorCode: val.colorCode,
      image: val.image,
      sortOrder: val.sortOrder,
    })),
  }))

  // Related products
  const relatedProducts: ProductCardData[] = product.relatedFrom
    .map((r) => r.related)
    .filter((p) => p.status === "PUBLISHED")
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDesc: p.shortDesc,
      priceUsd: Number(p.priceUsd),
      priceTl: Number(p.priceTl),
      salePriceUsd: p.salePriceUsd ? Number(p.salePriceUsd) : null,
      salePriceTl: p.salePriceTl ? Number(p.salePriceTl) : null,
      stockQty: p.stockQty,
      isNew: p.isNew,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      images: p.images,
      brand: p.brand,
      categories: p.categories,
    }))

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Product main section */}
      <div className="mt-6">
        <ProductDetailClient
          product={serializedProduct}
          variationTypes={serializedVariationTypes}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">Ilgili Ürünler</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
