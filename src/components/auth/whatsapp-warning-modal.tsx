"use client"

import { useState, useEffect } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WhatsAppWarningModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const accepted = document.cookie
      .split("; ")
      .find((row) => row.startsWith("whatsapp_warning_accepted="))
    if (!accepted) {
      setShow(true)
    }
  }, [])

  const handleAccept = () => {
    const date = new Date()
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000)
    document.cookie = `whatsapp_warning_accepted=true; expires=${date.toUTCString()}; path=/`
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#25D366]">
          <MessageCircle className="h-10 w-10 text-white" />
        </div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Önemli Bilgilendirme
        </h2>
        <p className="mb-8 text-gray-600 leading-relaxed">
          Sitemizde ödeme işlemleri yalnızca WhatsApp üzerinden
          gerçekleştirilmektedir. Sipariş, ödeme ve iletişim süreçlerinde
          lütfen sadece ve sadece WhatsApp mesajı yoluyla bizimle iletişime
          geçiniz.
        </p>
        <Button
          onClick={handleAccept}
          className="w-full rounded-xl bg-[#25D366] py-6 text-lg font-semibold text-white hover:bg-[#1da851] transition-colors"
        >
          Anladım, Devam Et
        </Button>
      </div>
    </div>
  )
}
