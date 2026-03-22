"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import Image from "next/image"

interface PopupBanner {
  id: string
  title?: string | null
  subtitle?: string | null
  image: string
  buttonText?: string | null
  buttonLink?: string | null
}

export function PopupModal() {
  const [popup, setPopup] = useState<PopupBanner | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("popup_shown")
    if (alreadyShown) return

    fetch("/api/banners/popup")
      .then((r) => r.json())
      .then((data) => {
        if (data.popup) {
          setPopup(data.popup)
          setVisible(true)
        }
      })
      .catch(() => {
        // Sessizce yoksay - popup gösterilmez
      })
  }, [])

  function handleClose() {
    sessionStorage.setItem("popup_shown", "true")
    setVisible(false)
  }

  if (!visible || !popup) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Kapat butonu */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Popup'ı kapat"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Görsel */}
        <div className="relative w-full aspect-[4/3] bg-gray-100">
          <Image
            src={popup.image}
            alt={popup.title ?? "Kampanya"}
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 512px"
          />
        </div>

        {/* İçerik */}
        {(popup.title || popup.subtitle || popup.buttonText) && (
          <div className="p-6 space-y-3 text-center">
            {popup.title && (
              <h2 className="text-xl font-bold text-gray-900">{popup.title}</h2>
            )}
            {popup.subtitle && (
              <p className="text-sm text-gray-600">{popup.subtitle}</p>
            )}
            {popup.buttonText && popup.buttonLink && (
              <a
                href={popup.buttonLink}
                onClick={handleClose}
                className="inline-block rounded-lg bg-amber-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-900 transition-colors"
              >
                {popup.buttonText}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
