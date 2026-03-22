"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/admin/product-form"

interface ProductData {
  id: string
  name: string
  slug: string
  shortDesc: string | null
  fullDesc: string | null
  sku: string
  barcode: string | null
  brandId: string | null
  manufacturer: string | null
  originCountry: string | null
  priceUsd: string | number
  priceTl: string | number
  salePriceUsd: string | number | null
  salePriceTl: string | number | null
  saleStart: string | null
  saleEnd: string | null
  vatRate: number
  vatIncluded: boolean
  stockTracking: boolean
  stockQty: number
  lowStockThreshold: number
  weight: string | number | null
  width: string | number | null
  height: string | number | null
  depth: string | number | null
  isFeatured: boolean
  isNew: boolean
  isBestSeller: boolean
  seoTitle: string | null
  seoDesc: string | null
  status: string
  visibility: string
  publishAt: string | null
  sortOrder: number
  categories: Array<{ category: { id: string; name: string } }>
  tags: Array<{ tag: { id: string; name: string } }>
}

export default function EditProductPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/admin/products/${id}`)
        if (!res.ok) {
          setError("Ürün bulunamadı")
          return
        }
        const data = await res.json()
        setProduct(data)
      } catch {
        setError("Ürün yüklenirken bir hata oluştu")
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/admin/urunler" />}>
            <ChevronLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Hata</h1>
        </div>
        <div className="rounded-lg border bg-destructive/10 p-6 text-center text-destructive">
          {error || "Ürün bulunamadı"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/admin/urunler" />}>
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ürünü Düzenle</h1>
          <p className="text-sm text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <ProductForm productId={id} initialData={product} />
    </div>
  )
}
