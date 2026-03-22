"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react"

interface GalleryImage {
  id: string
  url: string
  altText?: string | null
  title?: string | null
  variationId?: string | null
}

interface ImageGalleryProps {
  images: GalleryImage[]
  productName: string
  activeVariationImage?: string | null
}

export function ImageGallery({ images, productName, activeVariationImage }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // If a variation image is active, find it or use it as override
  const displayImages = images.length > 0 ? images : []
  const variationImageIndex = activeVariationImage
    ? displayImages.findIndex((img) => img.url === activeVariationImage)
    : -1

  const activeIndex = variationImageIndex >= 0 ? variationImageIndex : selectedIndex
  const currentImage = displayImages[activeIndex] || null
  const mainImageUrl = activeVariationImage && variationImageIndex < 0
    ? activeVariationImage
    : currentImage?.url

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1))
  }, [displayImages.length])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0))
  }, [displayImages.length])

  if (displayImages.length === 0 && !activeVariationImage) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-100">
        <ImageIcon className="h-16 w-16 text-gray-300" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main Image */}
        <div
          className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-gray-50"
          onClick={() => setLightboxOpen(true)}
        >
          {mainImageUrl ? (
            <Image
              src={mainImageUrl}
              alt={currentImage?.altText || productName}
              fill
              className="object-contain transition-transform duration-300 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}

          {/* Nav arrows on main image */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white"
                aria-label="Önceki resim"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white"
                aria-label="Sonraki resim"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {displayImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  index === activeIndex
                    ? "border-primary ring-1 ring-primary/30"
                    : "border-transparent hover:border-gray-300"
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.altText || `${productName} - ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && mainImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>

          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Önceki resim"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Sonraki resim"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            className="relative h-[80vh] w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={mainImageUrl}
              alt={currentImage?.altText || productName}
              fill
              className="object-contain"
              sizes="80vw"
            />
          </div>
        </div>
      )}
    </>
  )
}
