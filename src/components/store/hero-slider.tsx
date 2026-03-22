"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Banner {
  id: string
  title: string | null
  subtitle: string | null
  image: string
  mediaType: string
  buttonText: string | null
  buttonLink: string | null
  duration: number
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function getMediaType(banner: Banner): "image" | "video" | "youtube" {
  const url = banner.image.toLowerCase()
  const ytId = getYouTubeId(banner.image)
  if (ytId) return "youtube"
  if (banner.mediaType === "video") return "video"
  if (url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".ogg")) return "video"
  return "image"
}

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())

  const slide = banners[current]
  const duration = (slide?.duration || 5) * 1000

  const goTo = useCallback((index: number) => {
    setCurrent(index)
  }, [])

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length)
  }, [banners.length])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length)
  }, [banners.length])

  // Auto-play timer
  useEffect(() => {
    if (banners.length <= 1) return
    const currentBanner = banners[current]
    const type = getMediaType(currentBanner)

    if (type === "video") {
      const videoEl = videoRefs.current.get(current)
      if (videoEl) {
        const onEnded = () => next()
        videoEl.addEventListener("ended", onEnded, { once: true })
        timerRef.current = setTimeout(next, Math.max(duration, 15000))
        return () => {
          videoEl.removeEventListener("ended", onEnded)
          if (timerRef.current) clearTimeout(timerRef.current)
        }
      }
    }

    // YouTube & images use duration timer
    timerRef.current = setTimeout(next, type === "youtube" ? Math.max(duration, 10000) : duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [current, banners, duration, next])

  // Play/pause native videos on slide change
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index === current) {
        video.currentTime = 0
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [current])

  if (banners.length === 0) return null

  return (
    <section className="relative h-[480px] overflow-hidden bg-stone-950 sm:h-[560px] lg:h-[640px]">
      {/* Slides */}
      {banners.map((banner, i) => {
        const type = getMediaType(banner)
        const ytId = getYouTubeId(banner.image)

        return (
          <div
            key={banner.id}
            className="absolute inset-0 transition-all duration-700 ease-in-out"
            style={{
              opacity: i === current ? 1 : 0,
              zIndex: i === current ? 1 : 0,
              pointerEvents: i === current ? "auto" : "none",
            }}
          >
            {type === "youtube" && ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=${i === current ? 1 : 0}&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${ytId}&modestbranding=1&playsinline=1`}
                className="absolute inset-0 h-[120%] w-[120%] -left-[10%] -top-[10%] border-0"
                style={{ pointerEvents: "none" }}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : type === "video" ? (
              <video
                ref={(el) => { if (el) videoRefs.current.set(i, el) }}
                src={banner.image}
                className="absolute inset-0 h-full w-full object-cover"
                muted
                playsInline
                loop={banners.length === 1}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner.image}
                alt={banner.title || ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/80 via-stone-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-stone-950/20" />
          </div>
        )
      })}

      {/* Content */}
      <div className="relative z-10 flex h-full items-center pointer-events-none">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="max-w-xl pointer-events-auto">
            {slide?.title && (
              <h1
                className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
                style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
              >
                {slide.title}
              </h1>
            )}
            {slide?.subtitle && (
              <p className="mb-8 max-w-md text-base leading-relaxed text-stone-300 sm:text-lg">
                {slide.subtitle}
              </p>
            )}
            {slide?.buttonText && slide?.buttonLink && (
              <Link
                href={slide.buttonLink}
                className="group inline-flex items-center gap-2 rounded-xl bg-amber-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/25 transition-all hover:bg-amber-700 hover:shadow-xl active:scale-[0.98]"
              >
                {slide.buttonText}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:left-6 sm:size-12"
          >
            <ChevronLeft className="size-5 sm:size-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 sm:right-6 sm:size-12"
          >
            <ChevronRight className="size-5 sm:size-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-amber-500" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
