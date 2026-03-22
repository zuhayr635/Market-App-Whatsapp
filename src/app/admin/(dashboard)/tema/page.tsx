"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ThemeColors {
  // Ana Renkler
  primary: string
  secondary: string
  accent: string
  // Arka Plan
  bg_page: string
  bg_card: string
  bg_header: string
  bg_footer: string
  // Metin
  text_primary: string
  text_secondary: string
  text_heading: string
  text_link: string
  // Buton
  btn_primary_bg: string
  btn_primary_text: string
  btn_secondary_bg: string
  btn_secondary_text: string
  // Özel
  color_whatsapp: string
  color_cart: string
  color_favorite: string
  color_discount_badge: string
  color_new_badge: string
  // Border radius
  border_radius: string
}

const defaults: ThemeColors = {
  primary: "#2563eb",
  secondary: "#64748b",
  accent: "#f59e0b",
  bg_page: "#f8fafc",
  bg_card: "#ffffff",
  bg_header: "#1e293b",
  bg_footer: "#0f172a",
  text_primary: "#0f172a",
  text_secondary: "#64748b",
  text_heading: "#1e293b",
  text_link: "#2563eb",
  btn_primary_bg: "#2563eb",
  btn_primary_text: "#ffffff",
  btn_secondary_bg: "#e2e8f0",
  btn_secondary_text: "#0f172a",
  color_whatsapp: "#25d366",
  color_cart: "#2563eb",
  color_favorite: "#ef4444",
  color_discount_badge: "#ef4444",
  color_new_badge: "#22c55e",
  border_radius: "0.5rem",
}

const presets: { name: string; label: string; colors: Partial<ThemeColors> }[] = [
  {
    name: "minimalist",
    label: "Minimalist",
    colors: {
      primary: "#1d4ed8", secondary: "#374151", accent: "#3b82f6",
      bg_page: "#ffffff", bg_card: "#f9fafb", bg_header: "#111827", bg_footer: "#030712",
      text_primary: "#111827", text_secondary: "#6b7280", text_heading: "#111827", text_link: "#1d4ed8",
      btn_primary_bg: "#1d4ed8", btn_primary_text: "#ffffff",
      border_radius: "0.25rem",
    },
  },
  {
    name: "dark",
    label: "Koyu",
    colors: {
      primary: "#f59e0b", secondary: "#78716c", accent: "#fbbf24",
      bg_page: "#0f0f0f", bg_card: "#1a1a1a", bg_header: "#050505", bg_footer: "#000000",
      text_primary: "#f5f5f5", text_secondary: "#a8a29e", text_heading: "#fef3c7", text_link: "#f59e0b",
      btn_primary_bg: "#f59e0b", btn_primary_text: "#000000",
      border_radius: "0.375rem",
    },
  },
  {
    name: "warm",
    label: "Sıcak",
    colors: {
      primary: "#ea580c", secondary: "#92400e", accent: "#f97316",
      bg_page: "#fff7ed", bg_card: "#ffffff", bg_header: "#7c2d12", bg_footer: "#431407",
      text_primary: "#1c1917", text_secondary: "#78716c", text_heading: "#7c2d12", text_link: "#ea580c",
      btn_primary_bg: "#ea580c", btn_primary_text: "#ffffff",
      border_radius: "0.75rem",
    },
  },
  {
    name: "modern",
    label: "Modern",
    colors: {
      primary: "#7c3aed", secondary: "#06b6d4", accent: "#ec4899",
      bg_page: "#faf5ff", bg_card: "#ffffff", bg_header: "#4c1d95", bg_footer: "#2e1065",
      text_primary: "#1e1b4b", text_secondary: "#6d28d9", text_heading: "#4c1d95", text_link: "#7c3aed",
      btn_primary_bg: "#7c3aed", btn_primary_text: "#ffffff",
      border_radius: "1rem",
    },
  },
]

type ThemeKey = keyof ThemeColors

function injectTheme(colors: ThemeColors) {
  const existing = document.getElementById("theme-vars")
  const style = existing || document.createElement("style")
  style.id = "theme-vars"
  const vars = Object.entries(colors)
    .map(([k, v]) => `  --theme-${k}: ${v};`)
    .join("\n")
  style.textContent = `:root {\n${vars}\n}`
  if (!existing) document.head.appendChild(style)
}

export default function TemaPage() {
  const [colors, setColors] = useState<ThemeColors>(defaults)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/theme")
      .then((r) => r.json())
      .then((data: { key: string; value: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const map: Partial<ThemeColors> = {}
          for (const s of data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(map as any)[s.key] = s.value
          }
          setColors((prev) => ({ ...prev, ...map }))
        }
      })
  }, [])

  function set(key: ThemeKey, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  function applyPreset(preset: Partial<ThemeColors>) {
    setColors((prev) => ({ ...prev, ...preset }))
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch("/api/admin/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(colors),
    })
    if (res.ok) {
      injectTheme(colors)
    }
    setSaving(false)
  }

  function handleReset() {
    setColors(defaults)
  }

  function ColorRow({ label, k }: { label: string; k: ThemeKey }) {
    return (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <Label className="text-sm">{label}</Label>
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-12 rounded border"
            style={{ backgroundColor: colors[k] }}
          />
          <input
            type="color"
            value={colors[k].startsWith("#") ? colors[k] : "#000000"}
            onChange={(e) => set(k, e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border p-0.5"
          />
          <Input
            value={colors[k]}
            onChange={(e) => set(k, e.target.value)}
            className="h-8 w-28 text-xs font-mono"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tema Yönetimi</h1>
          <p className="text-muted-foreground">Site renklerini ve görünümünü özelleştirin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Varsayılan Temaya Dön
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      {/* Preset themes */}
      <Card>
        <CardHeader>
          <CardTitle>Hazır Temalar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p.colors)}
              className="flex flex-col items-center gap-1 rounded-lg border-2 border-transparent hover:border-blue-400 p-3 transition-all hover:bg-gray-50"
            >
              <div className="flex gap-1">
                {[p.colors.primary, p.colors.bg_card, p.colors.accent].map((c, i) => (
                  <div key={i} className="h-6 w-6 rounded-full border" style={{ backgroundColor: c || "#ccc" }} />
                ))}
              </div>
              <span className="text-sm font-medium">{p.label}</span>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Color pickers */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Ana Renkler</CardTitle></CardHeader>
            <CardContent>
              <ColorRow label="Primary" k="primary" />
              <ColorRow label="Secondary" k="secondary" />
              <ColorRow label="Accent" k="accent" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Arka Plan</CardTitle></CardHeader>
            <CardContent>
              <ColorRow label="Sayfa" k="bg_page" />
              <ColorRow label="Kart" k="bg_card" />
              <ColorRow label="Header" k="bg_header" />
              <ColorRow label="Footer" k="bg_footer" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Metin</CardTitle></CardHeader>
            <CardContent>
              <ColorRow label="Ana" k="text_primary" />
              <ColorRow label="İkincil" k="text_secondary" />
              <ColorRow label="Başlık" k="text_heading" />
              <ColorRow label="Link" k="text_link" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Butonlar</CardTitle></CardHeader>
            <CardContent>
              <ColorRow label="Primary Arka Plan" k="btn_primary_bg" />
              <ColorRow label="Primary Metin" k="btn_primary_text" />
              <ColorRow label="Secondary Arka Plan" k="btn_secondary_bg" />
              <ColorRow label="Secondary Metin" k="btn_secondary_text" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Özel Renkler</CardTitle></CardHeader>
            <CardContent>
              <ColorRow label="WhatsApp" k="color_whatsapp" />
              <ColorRow label="Sepet" k="color_cart" />
              <ColorRow label="Favori" k="color_favorite" />
              <ColorRow label="İndirim Badge" k="color_discount_badge" />
              <ColorRow label="Yeni Badge" k="color_new_badge" />
              <div className="flex items-center justify-between py-2">
                <Label className="text-sm">Border Radius</Label>
                <Input
                  value={colors.border_radius}
                  onChange={(e) => set("border_radius", e.target.value)}
                  className="h-8 w-28 text-xs font-mono"
                  placeholder="0.5rem"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader><CardTitle>Canlı Önizleme</CardTitle></CardHeader>
            <CardContent>
              <div
                className="rounded-lg p-4 space-y-4"
                style={{
                  backgroundColor: colors.bg_page,
                  borderRadius: colors.border_radius,
                }}
              >
                {/* Header */}
                <div
                  className="rounded px-3 py-2 text-sm font-bold"
                  style={{
                    backgroundColor: colors.bg_header,
                    color: "#ffffff",
                  }}
                >
                  Header Alanı
                </div>

                {/* Card */}
                <div
                  className="rounded p-3 shadow"
                  style={{
                    backgroundColor: colors.bg_card,
                    borderRadius: colors.border_radius,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h3
                    className="font-bold text-sm mb-1"
                    style={{ color: colors.text_heading }}
                  >
                    Ürün Başlığı
                  </h3>
                  <p className="text-xs mb-2" style={{ color: colors.text_secondary }}>
                    Ürün açıklaması
                  </p>
                  <div className="flex gap-1 mb-2 flex-wrap">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white font-bold"
                      style={{ backgroundColor: colors.color_discount_badge }}
                    >
                      %20 İndirim
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white font-bold"
                      style={{ backgroundColor: colors.color_new_badge }}
                    >
                      Yeni
                    </span>
                  </div>
                  <p className="font-bold text-sm mb-2" style={{ color: colors.primary }}>
                    $29.99
                  </p>
                  <button
                    className="w-full py-1.5 text-xs font-bold rounded"
                    style={{
                      backgroundColor: colors.btn_primary_bg,
                      color: colors.btn_primary_text,
                      borderRadius: colors.border_radius,
                    }}
                  >
                    Sepete Ekle
                  </button>
                </div>

                {/* Link */}
                <a
                  href="#"
                  className="text-xs underline block"
                  style={{ color: colors.text_link }}
                >
                  Daha fazla görüntüle →
                </a>

                {/* WhatsApp */}
                <div
                  className="text-xs text-white px-2 py-1 rounded inline-flex items-center gap-1"
                  style={{
                    backgroundColor: colors.color_whatsapp,
                    borderRadius: colors.border_radius,
                  }}
                >
                  WhatsApp Destek
                </div>

                {/* Footer */}
                <div
                  className="rounded px-3 py-2 text-xs"
                  style={{
                    backgroundColor: colors.bg_footer,
                    color: "#9ca3af",
                  }}
                >
                  Footer Alanı
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
