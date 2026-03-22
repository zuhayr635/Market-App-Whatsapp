"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, Mail, MapPin, Clock, MessageCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface SiteSettings {
  contact_phone?: string
  contact_email?: string
  contact_address?: string
  working_hours?: string
  whatsapp_number?: string
  map_lat?: string
  map_lng?: string
}

export default function IletisimPage() {
  const [settings, setSettings] = useState<SiteSettings>({})
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const map: SiteSettings = {}
        if (data.settings) {
          for (const s of data.settings) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(map as any)[s.key] = s.value
          }
        }
        setSettings(map)
      })
      .catch(() => {})
  }, [])

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Lütfen tüm alanları doldurun")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSent(true)
        setForm({ name: "", email: "", subject: "", message: "" })
        toast.success("Mesajınız gönderildi. En kısa sürede size dönüş yapacağız.")
      } else {
        const data = await res.json()
        toast.error(data.error || "Mesaj gönderilemedi")
      }
    } finally {
      setSending(false)
    }
  }

  const whatsappNumber = settings.whatsapp_number?.replace(/\D/g, "") || ""
  const mapLat = settings.map_lat || "41.0082"
  const mapLng = settings.map_lng || "28.9784"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-12 text-center text-white">
        <h1 className="text-3xl font-bold">İletişim</h1>
        <p className="mt-2 text-blue-100">Sorularınız için bize ulaşın</p>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Form */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-6 text-xl font-semibold">Mesaj Gönderin</h2>

              {sent ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
                  <h3 className="text-lg font-semibold">Mesajınız Alındı!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    En kısa sürede size dönüş yapacağız.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSent(false)}
                  >
                    Yeni Mesaj Gönder
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="name">Ad Soyad</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder="Adınız ve soyadınız"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="ornek@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="subject">Konu</Label>
                    <Input
                      id="subject"
                      value={form.subject}
                      onChange={(e) => setField("subject", e.target.value)}
                      placeholder="Mesajınızın konusu"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="message">Mesaj</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setField("message", e.target.value)}
                      placeholder="Mesajınızı buraya yazın..."
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? "Gönderiliyor..." : "Mesaj Gönder"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">İletişim Bilgileri</h2>
                <div className="space-y-4">
                  {settings.contact_phone && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <Phone className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Telefon</p>
                        <p className="text-sm font-medium">{settings.contact_phone}</p>
                      </div>
                    </div>
                  )}
                  {settings.contact_email && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">E-posta</p>
                        <p className="text-sm font-medium">{settings.contact_email}</p>
                      </div>
                    </div>
                  )}
                  {settings.contact_address && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Adres</p>
                        <p className="text-sm">{settings.contact_address}</p>
                      </div>
                    </div>
                  )}
                  {settings.working_hours && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Çalışma Saatleri</p>
                        <p className="text-sm">{settings.working_hours}</p>
                      </div>
                    </div>
                  )}
                  {!settings.contact_phone && !settings.contact_email && !settings.contact_address && (
                    <p className="text-sm text-muted-foreground">
                      İletişim bilgileri ayarlardan düzenlenebilir.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp button */}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-500 px-4 py-3 text-white font-medium hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp ile Ulaşın
              </a>
            )}

            {/* Google Maps embed */}
            <div className="overflow-hidden rounded-xl border">
              <iframe
                title="Konum"
                width="100%"
                height="220"
                loading="lazy"
                src={`https://maps.google.com/maps?q=${mapLat},${mapLng}&z=15&output=embed`}
                className="border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
