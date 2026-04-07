"use client"

import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"

export function WhatsAppFloat() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [template, setTemplate] = useState("Merhaba, ürünleriniz hakkında bilgi almak istiyorum.")
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, string> = {}
        for (const s of data.settings || []) map[s.key] = s.value
        if (map.whatsapp_number) setPhoneNumber(map.whatsapp_number)
        if (map.whatsapp_template) setTemplate(map.whatsapp_template)
        if (map.whatsapp_float_enabled === "false") setEnabled(false)
      })
      .catch(() => {})
  }, [])

  if (!enabled || !phoneNumber) return null

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(template)}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile yazın"
      className="group fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg shadow-green-600/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-600/40"
    >
      <MessageCircle className="size-6" />
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
        Bize yazın
      </span>
    </a>
  )
}
