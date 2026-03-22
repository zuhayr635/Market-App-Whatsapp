"use client"

import { MessageCircle } from "lucide-react"

export function WhatsAppFloat() {
  const phoneNumber = "905551234567"
  const message = encodeURIComponent("Merhaba, ürünleriniz hakkında bilgi almak istiyorum.")
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Bize yazın"
      title="Bize yazın"
      className="group fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-[var(--market-whatsapp)] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
    >
      <MessageCircle className="size-6 transition-transform duration-300 group-hover:scale-110" />

      {/* Pulse ring */}
      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--market-whatsapp)] opacity-20" />

      {/* Tooltip */}
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
        Bize yazın
      </span>
    </a>
  )
}
