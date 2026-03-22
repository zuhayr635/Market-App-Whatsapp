"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  const image = product.images[0]
  const hasDiscount = product.salePriceUsd != null && product.salePriceUsd < product.priceUsd
  const discountPercent = hasDiscount
    ? Math.round(((product.priceUsd - product.salePriceUsd!) / product.priceUsd) * 100)
    : 0
  const displayPriceUsd = hasDiscount ? product.salePriceUsd! : product.priceUsd
  const displayPriceTl = hasDiscount && product.salePriceTl ? product.salePriceTl : product.priceTl
  const outOfStock = product.stockQty <= 0

  if (viewMode === "list") {
    return (
      <div className="group flex gap-4 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md sm:p-4">
        {/* Image */}
        <Link
          href={`/urun/${product.slug}`}
          className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 sm:h-40 sm:w-40"
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.altText || product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="160px"
              loading="lazy"
            />
          ) : (
            <ImageIcon className="h-10 w-10 text-gray-300" />
          )}
          {/* Badges */}
          <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
            {product.isNew && (
              <span className="rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Yeni
              </span>
            )}
            {hasDiscount && (
              <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                %{discountPercent}
              </span>
            )}
            {outOfStock && (
              <span className="rounded bg-gray-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Tukendi
              </span>
            )}
          </div>
        </Link>

        {/* Details */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            {product.brand && (
              <p className="text-xs text-muted-foreground">{product.brand.name}</p>
            )}
            <Link href={`/urun/${product.slug}`}>
              <h3 className="line-clamp-2 text-sm font-medium text-foreground hover:text-blue-600 transition-colors sm:text-base">
                {product.name}
              </h3>
            </Link>
            {product.shortDesc && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                {product.shortDesc}
              </p>
            )}
          </div>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                {hasDiscount && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.priceUsd.toFixed(2)}
                  </span>
                )}
                <span className={cn("text-lg font-bold", hasDiscount ? "text-red-600" : "text-foreground")}>
                  ${displayPriceUsd.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {hasDiscount && product.salePriceTl ? (
                  <>{displayPriceTl.toFixed(2)} TL</>
                ) : (
                  <>{product.priceTl.toFixed(2)} TL</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon-sm">
                <Heart className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                disabled={outOfStock}
              >
                <ShoppingCart className="mr-1 h-3.5 w-3.5" />
                Sepete Ekle
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid mode
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg">
      {/* Image */}
      <Link
        href={`/urun/${product.slug}`}
        className="relative aspect-square overflow-hidden bg-gray-100"
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="rounded-md bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              Yeni
            </span>
          )}
          {hasDiscount && (
            <span className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              %{discountPercent} Indirim
            </span>
          )}
          {outOfStock && (
            <span className="rounded-md bg-gray-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              Tukendi
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-red-500 group-hover:opacity-100"
          aria-label="Favorilere ekle"
        >
          <Heart className="h-4 w-4" />
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        {product.brand && (
          <p className="text-xs text-muted-foreground">{product.brand.name}</p>
        )}
        <Link href={`/urun/${product.slug}`}>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground transition-colors hover:text-blue-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          {/* Price */}
          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.priceUsd.toFixed(2)}
              </span>
            )}
            <span className={cn("text-lg font-bold", hasDiscount ? "text-red-600" : "text-foreground")}>
              ${displayPriceUsd.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {displayPriceTl.toFixed(2)} TL
          </p>

          {/* Add to cart */}
          <Button
            className="mt-2 w-full"
            size="sm"
            disabled={outOfStock}
          >
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
            {outOfStock ? "Stokta Yok" : "Sepete Ekle"}
          </Button>
        </div>
      </div>
    </div>
  )
}
