"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Heart,
  Share2,
  Copy,
  ExternalLink,
  Download,
  FileText,
  Star,
  Clock,
  Check,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ImageGallery } from "@/components/store/image-gallery"
import { VariationSelector } from "@/components/store/variation-selector"
import { QuantitySelector } from "@/components/store/quantity-selector"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { StockAlertForm } from "@/components/stock-alert-form"
import { toast } from "sonner"

interface ProductImage {
  id: string
  url: string
  altText?: string | null
  title?: string | null
  variationId?: string | null
}

interface ProductVariation {
  id: string
  combination: Record<string, string>
  priceDiff: number | null
  salePrice: number | null
  stock: number
  imageUrl: string | null
  sku: string | null
}

interface VariationValue {
  id: string
  variationTypeId: string
  value: string
  colorCode?: string | null
  image?: string | null
  sortOrder: number
}

interface VariationType {
  id: string
  name: string
  displayType: string
  sortOrder: number
  values: VariationValue[]
}

interface ProductAttribute {
  id: string
  value: string
  attributeType: { id: string; name: string; slug: string }
}

interface ProductTab {
  id: string
  title: string
  content: string
  icon?: string | null
}

interface ProductFile {
  id: string
  fileName: string
  url: string
  fileSize: number
  downloadable: boolean
}

interface ProductLink {
  id: string
  title: string
  url: string
  icon?: string | null
  newTab: boolean
}

interface SerializedProduct {
  id: string
  name: string
  slug: string
  shortDesc?: string | null
  fullDesc?: string | null
  sku: string
  barcode?: string | null
  manufacturer?: string | null
  originCountry?: string | null
  priceUsd: number
  priceTl: number
  salePriceUsd: number | null
  salePriceTl: number | null
  saleStart: string | null
  saleEnd: string | null
  vatRate: number
  stockTracking: boolean
  stockQty: number
  lowStockThreshold: number
  isFeatured: boolean
  isNew: boolean
  isBestSeller: boolean
  brand?: { id: string; name: string; slug: string; logo?: string | null } | null
  images: ProductImage[]
  videos: { id: string; url: string; type: string; thumbnail?: string | null; title?: string | null }[]
  files: ProductFile[]
  links: ProductLink[]
  attributes: ProductAttribute[]
  tabs: ProductTab[]
  tags: { id: string; name: string; slug: string }[]
  variations: ProductVariation[]
}

interface ProductDetailClientProps {
  product: SerializedProduct
  variationTypes: VariationType[]
  isLoggedIn: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SaleCountdown({ saleEnd }: { saleEnd: string }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime()
      const end = new Date(saleEnd).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft("")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      const parts = []
      if (days > 0) parts.push(`${days}g`)
      parts.push(`${hours.toString().padStart(2, "0")}s`)
      parts.push(`${minutes.toString().padStart(2, "0")}d`)
      parts.push(`${seconds.toString().padStart(2, "0")}sn`)
      setTimeLeft(parts.join(" "))
    }

    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [saleEnd])

  if (!timeLeft) return null

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600">
      <Clock className="h-3.5 w-3.5" />
      <span>Kampanya bitimine: <strong>{timeLeft}</strong></span>
    </div>
  )
}

export function ProductDetailClient({
  product,
  variationTypes,
  isLoggedIn,
}: ProductDetailClientProps) {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [linkCopied, setLinkCopied] = useState(false)

  // Track recently viewed - call API on mount if user is logged in
  useEffect(() => {
    // Use fetch - don't block rendering
    fetch("/api/user/recently-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    }).catch(() => {}) // silently fail if not logged in
  }, [product.id])

  // Computed prices
  const hasDiscount = useMemo(() => {
    if (selectedVariation?.salePrice != null) return true
    return product.salePriceUsd != null && product.salePriceUsd < product.priceUsd
  }, [product, selectedVariation])

  const currentPriceUsd = useMemo(() => {
    if (selectedVariation) {
      if (selectedVariation.salePrice != null) return selectedVariation.salePrice
      const base = product.priceUsd + (selectedVariation.priceDiff || 0)
      return base
    }
    return hasDiscount && product.salePriceUsd != null ? product.salePriceUsd : product.priceUsd
  }, [product, selectedVariation, hasDiscount])

  const originalPriceUsd = useMemo(() => {
    if (selectedVariation) {
      return product.priceUsd + (selectedVariation.priceDiff || 0)
    }
    return product.priceUsd
  }, [product, selectedVariation])

  const currentPriceTl = useMemo(() => {
    // Approximate TL price based on ratio
    if (product.priceUsd === 0) return product.priceTl
    const ratio = product.priceTl / product.priceUsd
    return currentPriceUsd * ratio
  }, [product, currentPriceUsd])

  const discountPercent = useMemo(() => {
    if (!hasDiscount || originalPriceUsd === 0) return 0
    return Math.round(((originalPriceUsd - currentPriceUsd) / originalPriceUsd) * 100)
  }, [hasDiscount, originalPriceUsd, currentPriceUsd])

  // Stock
  const currentStock = selectedVariation ? selectedVariation.stock : product.stockQty
  const outOfStock = currentStock <= 0
  const lowStock = currentStock > 0 && currentStock <= product.lowStockThreshold

  // Active variation image
  const activeVariationImage = selectedVariation?.imageUrl || null

  // Current SKU
  const currentSku = selectedVariation?.sku || product.sku

  // WhatsApp URL
  const whatsAppUrl = useMemo(() => {
    const text = encodeURIComponent(
      `Merhaba, bu ürün hakkında bilgi almak istiyorum: ${product.name}\n${typeof window !== "undefined" ? window.location.href : ""}`
    )
    return `https://wa.me/?text=${text}`
  }, [product.name])

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setLinkCopied(true)
        toast.success("Link kopyalandı!")
        setTimeout(() => setLinkCopied(false), 2000)
      })
    }
  }

  const handleShareWhatsApp = () => {
    if (typeof window !== "undefined") {
      const text = encodeURIComponent(
        `${product.name}\n${window.location.href}`
      )
      window.open(`https://wa.me/?text=${text}`, "_blank")
    }
  }

  const handleVariationChange = (
    _selected: Record<string, string>,
    variation: ProductVariation | null
  ) => {
    setSelectedVariation(variation)
    setQuantity(1)
  }

  // Determine if sale is currently active
  const saleActive = useMemo(() => {
    if (!product.salePriceUsd) return false
    const now = new Date()
    if (product.saleStart && new Date(product.saleStart) > now) return false
    if (product.saleEnd && new Date(product.saleEnd) < now) return false
    return true
  }, [product.salePriceUsd, product.saleStart, product.saleEnd])

  return (
    <>
      {/* Main two-column layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Image Gallery */}
        <div>
          <ImageGallery
            images={product.images}
            productName={product.name}
            activeVariationImage={activeVariationImage}
          />
        </div>

        {/* Right: Product Info */}
        <div className="space-y-5">
          {/* Name */}
          <div>
            <h1 className="text-2xl font-bold leading-tight text-foreground lg:text-3xl">
              {product.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>SKU: {currentSku}</span>
              {product.brand && (
                <>
                  <span className="text-border">|</span>
                  <span>Marka: {product.brand.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Rating placeholder */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-4 w-4 fill-gray-200 text-gray-200"
              />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">
              (Henüz degerlendirme yok)
            </span>
          </div>

          {/* Price section */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              {hasDiscount && saleActive && (
                <span className="text-lg text-muted-foreground line-through">
                  ${originalPriceUsd.toFixed(2)}
                </span>
              )}
              <span className={`text-3xl font-bold ${hasDiscount && saleActive ? "text-red-600" : "text-foreground"}`}>
                ${currentPriceUsd.toFixed(2)}
              </span>
              {hasDiscount && saleActive && discountPercent > 0 && (
                <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  %{discountPercent}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentPriceTl.toFixed(2)} TL
            </p>

            {/* Sale countdown */}
            {hasDiscount && saleActive && product.saleEnd && (
              <SaleCountdown saleEnd={product.saleEnd} />
            )}
          </div>

          {/* Short description */}
          {product.shortDesc && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.shortDesc}
            </p>
          )}

          {/* Variation selector */}
          {product.variations.length > 0 && (
            <VariationSelector
              variationTypes={variationTypes}
              variations={product.variations}
              onChange={handleVariationChange}
            />
          )}

          {/* Stock indicator */}
          <div>
            {outOfStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600">
                Tükendi
              </span>
            ) : lowStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
                Son {currentStock} adet!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-600">
                <Check className="h-3.5 w-3.5" />
                Stokta
              </span>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div className="space-y-3">
            {!outOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Adet:</span>
                <QuantitySelector
                  value={quantity}
                  max={currentStock}
                  onChange={setQuantity}
                />
              </div>
            )}

            <AddToCartButton
              isLoggedIn={isLoggedIn}
              outOfStock={outOfStock}
              productId={product.id}
              variationId={selectedVariation?.id}
              quantity={quantity}
            />

            {outOfStock && (
              <StockAlertForm productId={product.id} />
            )}
          </div>

          {/* Favorite + WhatsApp + Share */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="default" className="gap-2">
              <Heart className="h-4 w-4" />
              Favorilere Ekle
            </Button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-green-300 bg-background px-2.5 text-sm font-medium text-green-600 transition-all hover:bg-green-50 hover:text-green-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp ile Soru Sor
            </a>
          </div>

          {/* Share */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Paylas:</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopyLink}
              title="Linki kopyala"
            >
              {linkCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleShareWhatsApp}
              title="WhatsApp ile paylas"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product detail tabs */}
      <div className="mt-10">
        <Tabs defaultValue="description">
          <TabsList variant="line" className="w-full justify-start border-b">
            <TabsTrigger value="description">Aciklama</TabsTrigger>
            {product.attributes.length > 0 && (
              <TabsTrigger value="attributes">Özellikler</TabsTrigger>
            )}
            <TabsTrigger value="shipping">Kargo &amp; Iade</TabsTrigger>
            {product.tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={`tab-${tab.id}`}>
                {tab.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="description" className="pt-6">
            {product.fullDesc ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: product.fullDesc }}
              />
            ) : product.shortDesc ? (
              <p className="text-sm text-muted-foreground">{product.shortDesc}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Ürün aciklamasi bulunmamaktadir.</p>
            )}
          </TabsContent>

          {product.attributes.length > 0 && (
            <TabsContent value="attributes" className="pt-6">
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <tbody>
                    {product.attributes.map((attr, index) => (
                      <tr
                        key={attr.id}
                        className={index % 2 === 0 ? "bg-muted/50" : "bg-background"}
                      >
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          {attr.attributeType.name}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {attr.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          )}

          <TabsContent value="shipping" className="pt-6">
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h3 className="mb-1 font-medium text-foreground">Kargo Bilgileri</h3>
                <p>Siparisleriniz 1-3 is günü icerisinde kargoya verilir. Kargo süresi bulundugunuz bölgeye göre degisiklik gösterebilir.</p>
              </div>
              <div>
                <h3 className="mb-1 font-medium text-foreground">Iade Politikasi</h3>
                <p>Ürünlerimizi teslim aldiginiz tarihten itibaren 14 gün icerisinde iade edebilirsiniz. Iade edilecek ürünlerin kullanilmamis ve orijinal ambalajinda olmasi gerekmektedir.</p>
              </div>
            </div>
          </TabsContent>

          {product.tabs.map((tab) => (
            <TabsContent key={tab.id} value={`tab-${tab.id}`} className="pt-6">
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: tab.content }}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Downloadable files */}
      {product.files.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold">Dosyalar</h2>
          <div className="space-y-2">
            {product.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </div>
                {file.downloadable && (
                  <a
                    href={file.url}
                    download
                    className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-input bg-background px-2.5 text-[0.8rem] font-medium transition-all hover:bg-muted"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Indir
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* External links */}
      {product.links.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-bold">Baglantílar</h2>
          <div className="space-y-2">
            {product.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target={link.newTab ? "_blank" : "_self"}
                rel={link.newTab ? "noopener noreferrer" : undefined}
                className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span>{link.title}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <RelatedProductsDisplay slug={product.slug} />
      <RecentlyViewedSection />
    </>
  )
}

function RelatedProductsDisplay({ slug }: { slug: string }) {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    fetch(`/api/products/${slug}/related`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setProducts(data) })
      .catch(() => {})
  }, [slug])

  if (products.length === 0) return null

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4 text-stone-900">İlgili Ürünler</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {products.slice(0, 4).map((p: any) => (
          <a key={p.id} href={`/urun/${p.slug}`} className="group">
            <div className="aspect-square overflow-hidden rounded-xl border border-[#E7E0D8] bg-stone-50">
              {p.images?.[0]?.url ? (
                <img src={p.images[0].url} alt={p.images[0].altText || p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs font-medium text-stone-800 line-clamp-2 group-hover:text-amber-700">{p.name}</p>
            <p className="text-xs text-amber-700 font-semibold">${Number(p.priceUsd).toFixed(2)}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

function RecentlyViewedSection() {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/user/recently-viewed")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.products) setProducts(data.products) })
      .catch(() => {})
  }, [])

  if (products.length === 0) return null

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4 text-stone-900">Son Görüntülenen Ürünler</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {products.slice(0, 4).map((p) => (
          <a key={p.id} href={`/urun/${p.slug}`} className="group">
            <div className="aspect-square overflow-hidden rounded-xl border border-[#E7E0D8] bg-stone-50">
              {p.images?.[0]?.url ? (
                <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs font-medium text-stone-800 line-clamp-2 group-hover:text-amber-700">{p.name}</p>
            <p className="text-xs text-amber-700 font-semibold">${Number(p.priceUsd).toFixed(2)}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
