import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { ProductStatus, Prisma } from "@/generated/prisma"
import { generateSlug } from "@/lib/utils/slug"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

interface ImportRow {
  name?: string
  sku?: string
  priceUsd?: string
  priceTl?: string
  stockQty?: string
  shortDesc?: string
  status?: string
  image_urls?: string
}

export async function POST(request: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const rows: ImportRow[] = body.rows

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Geçerli satır bulunamadı" }, { status: 400 })
    }

    let created = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowLabel = `Satır ${i + 2}`

      if (!row.name || !row.name.trim()) {
        errors.push(`${rowLabel}: Ürün adı zorunludur`)
        continue
      }

      const priceUsdNum = parseFloat(row.priceUsd || "")
      if (isNaN(priceUsdNum) || priceUsdNum < 0) {
        errors.push(`${rowLabel}: Geçerli bir USD fiyatı giriniz`)
        continue
      }

      try {
        const name = row.name.trim()
        const sku = row.sku?.trim() ? row.sku.trim() : `PRD-${Date.now()}-${i}`
        const priceTlNum = parseFloat(row.priceTl || "") || priceUsdNum
        const stockQtyNum = parseInt(row.stockQty || "0", 10) || 0
        const shortDesc = row.shortDesc?.trim() || null
        const statusValue = row.status?.trim().toUpperCase()
        const status: ProductStatus = Object.values(ProductStatus).includes(statusValue as ProductStatus)
          ? (statusValue as ProductStatus)
          : ProductStatus.DRAFT

        // Generate unique slug
        let slug = generateSlug(name)
        const existingSlug = await db.product.findUnique({ where: { slug } })
        if (existingSlug) {
          slug = `${slug}-${Date.now()}-${i}`
        }

        // Check SKU uniqueness
        const existingSku = await db.product.findUnique({ where: { sku } })
        if (existingSku) {
          errors.push(`${rowLabel}: SKU "${sku}" zaten kullanılıyor`)
          continue
        }

        const product = await db.product.create({
          data: {
            name,
            slug,
            sku,
            shortDesc,
            priceUsd: new Prisma.Decimal(priceUsdNum),
            priceTl: new Prisma.Decimal(priceTlNum),
            stockQty: stockQtyNum,
            status,
            vatRate: 18,
            vatIncluded: true,
            stockTracking: true,
            lowStockThreshold: 5,
            isFeatured: false,
            isNew: false,
            isBestSeller: false,
            sortOrder: 0,
            visibility: "PUBLIC",
          },
        })

        // Import images from image_urls column
        if (row.image_urls?.trim()) {
          const urls = row.image_urls.split("|").map((u) => u.trim()).filter(Boolean)
          for (let j = 0; j < urls.length; j++) {
            await db.productImage.create({
              data: {
                productId: product.id,
                url: urls[j],
                sortOrder: j,
                isFeatured: j === 0,
              },
            })
          }
        }

        created++
      } catch (err) {
        console.error(`Import row ${i + 2} error:`, err)
        errors.push(`${rowLabel}: Ürün oluşturulamadı`)
      }
    }

    return NextResponse.json({ created, errors })
  } catch (error) {
    console.error("Products import POST error:", error)
    return NextResponse.json(
      { error: "İçe aktarma sırasında bir hata oluştu" },
      { status: 500 }
    )
  }
}
