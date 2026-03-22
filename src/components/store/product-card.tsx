"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Heart, ShoppingCart, ImageIcon, Loader2, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/hooks/use-currency"
import { addToCart } from "@/lib/cart"
import { toast } from "sonner"

export interface ProductCardData {
  id: string
  name: string
  slug: string
  shortDesc?: string | null
  priceUsd: number
  priceTl: number
  salePriceUsd: number | null
  salePriceTl: number | null
  stockQty: number
  isNew: boolean
  isFeatured: boolean
  isBestSeller: boolean
  images: { id: string; url: string; altText: string | null }[]
  brand?: { id: string; name: string; slug: string } | null
  categories: {
    category: { id: string; name: string; slug: string }
  }[]
}

interface ProductCardProps {
  product: ProductCardData
  viewMode?: "grid" | "list"
}

export function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
  const { rate } = useCurrency()
  const { data: session } = useSession()
  const router = useRouter()
  const [cartLoading, setCartLoading] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!session?.user) { router.push("/giris"); return }
    setCartLoading(true)
    try {
      await addToCart(product.id)
      toast.success("Ürün sepete eklendi!")
      window.dispatchEvent(new CustomEvent("cart-updated"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sepete eklenemedi")
    } finally {
      setCartLoading(false)
    }
  }

  const image = product.images[0]
  const hasDiscount = product.salePriceUsd != null && product.salePriceUsd < product.priceUsd
  const discountPercent = hasDiscount
    ? Math.round(((product.priceUsd - product.salePriceUsd!) / product.priceUsd) * 100)
    : 0
  const displayPriceUsd = hasDiscount ? product.salePriceUsd! : product.priceUsd
  const displayPriceTl = displayPriceUsd * rate
  const outOfStock = product.stockQty <= 0

  if (viewMode === "list") {
    return (
      <div
        className="group flex gap-4 overflow-hidden rounded-2xl p-3 transition-all duration-300 sm:p-4"
        style={{ backgroundColor: '#12141A', border: '1px solid rgba(255,102,0,0.12)' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,102,0,0.3)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,102,0,0.12)')}
      >
        <Link
          href={`/urun/${product.slug}`}
          className="relative flex h-32 w-32 shrink-0 overflow-hidden rounded-xl sm:h-40 sm:w-40"
          style={{ backgroundColor: '#1A1D27' }}
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.altText || product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="160px"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-10 w-10" style={{ color: '#2A2A35' }} />
            </div>
          )}
          <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
            {product.isNew && (
              <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: 'var(--gold)', color: '#0A0B0F' }}>
                Yeni
              </span>
            )}
            {hasDiscount && (
              <span className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: '#7C1D1D' }}>
                %{discountPercent}
              </span>
            )}
            {outOfStock && (
              <span className="rounded-md bg-zinc-700 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                Tükendi
              </span>
            )}
          </div>
        </Link>

        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            {product.brand && (
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--gold-dim)' }}>
                {product.brand.name}
              </p>
            )}
            <Link href={`/urun/${product.slug}`}>
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors sm:text-base" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#F5F0E8' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-light)')}
                onMouseLeave={e => (e.currentTarget.style.color = '#F5F0E8')}
              >
                {product.name}
              </h3>
            </Link>
            {product.shortDesc && (
              <p className="mt-1 line-clamp-2 text-xs sm:text-sm" style={{ color: '#4A4640' }}>
                {product.shortDesc}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              {hasDiscount && (
                <p className="text-xs line-through" style={{ color: '#4A4640' }}>
                  {(product.priceUsd * rate).toFixed(2)} ₺
                </p>
              )}
              <p className="text-2xl font-semibold leading-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: 'var(--gold)' }}>
                {displayPriceTl.toFixed(2)} ₺
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                style={{ border: '1px solid rgba(255,102,0,0.15)', color: '#4A4640' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)'; (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.05)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,102,0,0.15)'; (e.currentTarget as HTMLElement).style.color = '#4A4640'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                aria-label="Favorilere ekle"
              >
                <Heart className="h-4 w-4" />
              </button>
              <button
                disabled={outOfStock || cartLoading}
                onClick={handleAddToCart}
                className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-all active:scale-[0.97]"
                style={{
                  backgroundColor: outOfStock ? '#1A1D27' : 'var(--gold)',
                  color: outOfStock ? '#4A4640' : '#0A0B0F',
                  cursor: outOfStock ? 'not-allowed' : 'pointer',
                }}
              >
                {cartLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">
                  {outOfStock ? "Tükendi" : "Sepete Ekle"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid mode
  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl transition-all duration-300"
      style={{ backgroundColor: '#12141A', border: '1px solid rgba(255,102,0,0.12)' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,102,0,0.35)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(255,102,0,0.08)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,102,0,0.12)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      {/* Image */}
      <Link href={`/urun/${product.slug}`} className="relative aspect-square overflow-hidden" style={{ backgroundColor: '#1A1D27' }}>
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12" style={{ color: '#2A2A35' }} />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundColor: 'rgba(10,11,15,0.35)' }}>
          <span className="rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,102,0,0.9)', color: '#0A0B0F' }}>
            İncele
          </span>
        </div>

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
          {product.isBestSeller && (
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: 'var(--gold)', color: '#0A0B0F' }}>
              <Zap className="h-2.5 w-2.5" /> Çok Satan
            </span>
          )}
          {product.isNew && !product.isBestSeller && (
            <span className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: 'rgba(255,102,0,0.15)', color: 'var(--gold)', border: '1px solid rgba(255,102,0,0.3)' }}>
              Yeni
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: '#7C1D1D' }}>
              %{discountPercent} İndirim
            </span>
          )}
          {outOfStock && (
            <span className="rounded-md bg-zinc-800/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 backdrop-blur-sm">
              Tükendi
            </span>
          )}
        </div>

        {/* Favorite */}
        <button
          className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100"
          style={{ backgroundColor: 'rgba(10,11,15,0.7)', border: '1px solid rgba(255,102,0,0.2)', color: '#6B6560' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.3)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B6560'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,102,0,0.2)' }}
          aria-label="Favorilere ekle"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--gold-dim)' }}>
            {product.brand.name}
          </p>
        )}
        <Link href={`/urun/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug transition-colors" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#D4CFC8', fontSize: '0.95rem' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold-light)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#D4CFC8')}
          >
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-semibold leading-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: 'var(--gold)' }}>
              {displayPriceTl.toFixed(2)} ₺
            </span>
            {hasDiscount && (
              <span className="text-xs line-through" style={{ color: '#4A4640' }}>
                {(product.priceUsd * rate).toFixed(2)} ₺
              </span>
            )}
          </div>

          <button
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
            )}
            style={{
              backgroundColor: outOfStock ? '#1A1D27' : '#1E1A12',
              color: outOfStock ? '#4A4640' : 'var(--gold)',
              border: outOfStock ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,102,0,0.25)',
              cursor: outOfStock ? 'not-allowed' : 'pointer',
            }}
            disabled={outOfStock || cartLoading}
            onClick={handleAddToCart}
            onMouseEnter={e => {
              if (!outOfStock) {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = 'var(--gold)'
                ;(e.currentTarget as HTMLElement).style.color = '#0A0B0F'
              }
            }}
            onMouseLeave={e => {
              if (!outOfStock) {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#1E1A12'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--gold)'
              }
            }}
          >
            {cartLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            {outOfStock ? "Stokta Yok" : "Sepete Ekle"}
          </button>
        </div>
      </div>
    </div>
  )
}
