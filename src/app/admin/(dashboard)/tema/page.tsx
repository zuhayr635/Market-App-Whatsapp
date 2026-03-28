"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Shuffle, Save, RotateCcw, Check, Palette, ChevronDown, ChevronUp } from "lucide-react"

interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  bg_page: string
  bg_card: string
  bg_header: string
  bg_footer: string
  text_primary: string
  text_secondary: string
  text_heading: string
  text_link: string
  btn_primary_bg: string
  btn_primary_text: string
  btn_secondary_bg: string
  btn_secondary_text: string
  color_whatsapp: string
  color_cart: string
  color_favorite: string
  color_discount_badge: string
  color_new_badge: string
  border_radius: string
}

type ThemeKey = keyof ThemeColors

const rcPresets: { id: string; name: string; emoji: string; desc: string; colors: ThemeColors }[] = [
  {
    id: "rc-orange",
    name: "RC Turuncu",
    emoji: "🟠",
    desc: "Koyu zemin, turuncu vurgu",
    colors: {
      primary: "#FF6600", secondary: "#CC4400", accent: "#FF8833",
      bg_page: "#0F0F0F", bg_card: "#1A1A1A", bg_header: "#111111", bg_footer: "#0A0A0A",
      text_primary: "#F0F0F0", text_secondary: "#AAAAAA", text_heading: "#FF6600", text_link: "#FF6600",
      btn_primary_bg: "#FF6600", btn_primary_text: "#000000",
      btn_secondary_bg: "#2A2A2A", btn_secondary_text: "#F0F0F0",
      color_whatsapp: "#25D366", color_cart: "#FF6600", color_favorite: "#FF4444",
      color_discount_badge: "#FF6600", color_new_badge: "#FF8833",
      border_radius: "0.5rem",
    },
  },
  {
    id: "race-red",
    name: "Yarış Kırmızısı",
    emoji: "🔴",
    desc: "Agresif yarış stili",
    colors: {
      primary: "#CC0000", secondary: "#990000", accent: "#FF6600",
      bg_page: "#0A0A0A", bg_card: "#1C1C1C", bg_header: "#0D0000", bg_footer: "#080000",
      text_primary: "#F5F5F5", text_secondary: "#AAAAAA", text_heading: "#FF2222", text_link: "#CC0000",
      btn_primary_bg: "#CC0000", btn_primary_text: "#FFFFFF",
      btn_secondary_bg: "#2A1010", btn_secondary_text: "#F5F5F5",
      color_whatsapp: "#25D366", color_cart: "#CC0000", color_favorite: "#FF6600",
      color_discount_badge: "#CC0000", color_new_badge: "#FF4400",
      border_radius: "0.375rem",
    },
  },
  {
    id: "electric-blue",
    name: "Elektrik Mavisi",
    emoji: "⚡",
    desc: "Elektrikli araç teması",
    colors: {
      primary: "#0066FF", secondary: "#0044CC", accent: "#00CCFF",
      bg_page: "#080D18", bg_card: "#0F1A2E", bg_header: "#060D1A", bg_footer: "#040A12",
      text_primary: "#E0EEFF", text_secondary: "#7799BB", text_heading: "#00AAFF", text_link: "#0066FF",
      btn_primary_bg: "#0066FF", btn_primary_text: "#FFFFFF",
      btn_secondary_bg: "#0F1A2E", btn_secondary_text: "#E0EEFF",
      color_whatsapp: "#25D366", color_cart: "#0066FF", color_favorite: "#FF4444",
      color_discount_badge: "#0066FF", color_new_badge: "#00CCFF",
      border_radius: "0.5rem",
    },
  },
  {
    id: "carbon-fiber",
    name: "Karbon Fiber",
    emoji: "🖤",
    desc: "Tam siyah, metalik gri",
    colors: {
      primary: "#888888", secondary: "#555555", accent: "#AAAAAA",
      bg_page: "#0A0A0A", bg_card: "#1A1A1A", bg_header: "#111111", bg_footer: "#050505",
      text_primary: "#D0D0D0", text_secondary: "#888888", text_heading: "#C0C0C0", text_link: "#AAAAAA",
      btn_primary_bg: "#444444", btn_primary_text: "#FFFFFF",
      btn_secondary_bg: "#222222", btn_secondary_text: "#D0D0D0",
      color_whatsapp: "#25D366", color_cart: "#888888", color_favorite: "#FF4444",
      color_discount_badge: "#666666", color_new_badge: "#888888",
      border_radius: "0.25rem",
    },
  },
  {
    id: "gold-champion",
    name: "Altın Şampiyonu",
    emoji: "🏆",
    desc: "Premium siyah+altın",
    colors: {
      primary: "#D4A017", secondary: "#8B6914", accent: "#FFD700",
      bg_page: "#080600", bg_card: "#161200", bg_header: "#0D0A00", bg_footer: "#050400",
      text_primary: "#F0E0A0", text_secondary: "#A08020", text_heading: "#D4A017", text_link: "#D4A017",
      btn_primary_bg: "#D4A017", btn_primary_text: "#000000",
      btn_secondary_bg: "#201800", btn_secondary_text: "#F0E0A0",
      color_whatsapp: "#25D366", color_cart: "#D4A017", color_favorite: "#FF4444",
      color_discount_badge: "#D4A017", color_new_badge: "#FFD700",
      border_radius: "0.375rem",
    },
  },
  {
    id: "offroad-green",
    name: "Off-Road Yeşil",
    emoji: "🌿",
    desc: "Crawler & arazi teması",
    colors: {
      primary: "#4CAF50", secondary: "#2D5A1B", accent: "#8BC34A",
      bg_page: "#060D06", bg_card: "#0F1A0F", bg_header: "#0A140A", bg_footer: "#040804",
      text_primary: "#C8E6A0", text_secondary: "#6A9A6A", text_heading: "#66BB6A", text_link: "#4CAF50",
      btn_primary_bg: "#2D5A1B", btn_primary_text: "#C8E6A0",
      btn_secondary_bg: "#0F1A0F", btn_secondary_text: "#C8E6A0",
      color_whatsapp: "#25D366", color_cart: "#4CAF50", color_favorite: "#FF4444",
      color_discount_badge: "#4CAF50", color_new_badge: "#8BC34A",
      border_radius: "0.5rem",
    },
  },
  {
    id: "neon-storm",
    name: "Neon Fırtına",
    emoji: "⚡",
    desc: "Gaming / esport stili",
    colors: {
      primary: "#8800FF", secondary: "#5500AA", accent: "#FF00FF",
      bg_page: "#05000F", bg_card: "#120025", bg_header: "#0A0018", bg_footer: "#030008",
      text_primary: "#EE88FF", text_secondary: "#8844AA", text_heading: "#CC00FF", text_link: "#8800FF",
      btn_primary_bg: "#8800FF", btn_primary_text: "#FFFFFF",
      btn_secondary_bg: "#1A0035", btn_secondary_text: "#EE88FF",
      color_whatsapp: "#25D366", color_cart: "#8800FF", color_favorite: "#FF00FF",
      color_discount_badge: "#8800FF", color_new_badge: "#FF00FF",
      border_radius: "0.75rem",
    },
  },
  {
    id: "fire",
    name: "Ateş 🔥",
    emoji: "🔥",
    desc: "Nitro & ateş teması",
    colors: {
      primary: "#FF4500", secondary: "#CC2200", accent: "#FFD700",
      bg_page: "#100500", bg_card: "#1E0800", bg_header: "#150400", bg_footer: "#0A0200",
      text_primary: "#FFAA80", text_secondary: "#CC5533", text_heading: "#FFD700", text_link: "#FF6633",
      btn_primary_bg: "#CC2200", btn_primary_text: "#FFD700",
      btn_secondary_bg: "#2A0800", btn_secondary_text: "#FFAA80",
      color_whatsapp: "#25D366", color_cart: "#FF4500", color_favorite: "#FF6633",
      color_discount_badge: "#FFD700", color_new_badge: "#FF4500",
      border_radius: "0.5rem",
    },
  },
  {
    id: "steel-industry",
    name: "Çelik Endüstri",
    emoji: "⚙️",
    desc: "Lacivert metalik",
    colors: {
      primary: "#2244AA", secondary: "#1A3388", accent: "#4488FF",
      bg_page: "#0A0C10", bg_card: "#151B2A", bg_header: "#0D1020", bg_footer: "#060810",
      text_primary: "#A0B8D8", text_secondary: "#5577AA", text_heading: "#7AAAE8", text_link: "#5588CC",
      btn_primary_bg: "#2244AA", btn_primary_text: "#7AAAE8",
      btn_secondary_bg: "#1A2030", btn_secondary_text: "#A0B8D8",
      color_whatsapp: "#25D366", color_cart: "#2244AA", color_favorite: "#FF4444",
      color_discount_badge: "#4488FF", color_new_badge: "#2244AA",
      border_radius: "0.375rem",
    },
  },
  {
    id: "desert-heat",
    name: "Sıcak Çöl",
    emoji: "🏜️",
    desc: "Amber & deri tonu",
    colors: {
      primary: "#C87820", secondary: "#8B5000", accent: "#E8A840",
      bg_page: "#100800", bg_card: "#201200", bg_header: "#180A00", bg_footer: "#0A0500",
      text_primary: "#E0C080", text_secondary: "#8A6030", text_heading: "#D4901A", text_link: "#C87820",
      btn_primary_bg: "#3D2800", btn_primary_text: "#E8A840",
      btn_secondary_bg: "#201200", btn_secondary_text: "#E0C080",
      color_whatsapp: "#25D366", color_cart: "#C87820", color_favorite: "#FF4444",
      color_discount_badge: "#C87820", color_new_badge: "#E8A840",
      border_radius: "0.5rem",
    },
  },
]

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
  const [colors, setColors] = useState<ThemeColors>(rcPresets[7].colors) // Ateş varsayılan
  const [saving, setSaving] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>("fire")
  const [showEditor, setShowEditor] = useState(false)
  const [randomIndex, setRandomIndex] = useState(7)

  useEffect(() => {
    fetch("/api/admin/theme")
      .then((r) => r.json())
      .then((data: { key: string; value: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const map: Partial<ThemeColors> = {}
          for (const s of data) {
            (map as any)[s.key] = s.value
          }
          setColors((prev) => ({ ...prev, ...map }))
          setSelectedPreset("")
        }
      })
  }, [])

  function set(key: ThemeKey, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }))
    setSelectedPreset("")
  }

  function applyPreset(preset: typeof rcPresets[0]) {
    setColors(preset.colors)
    setSelectedPreset(preset.id)
  }

  const handleRandom = useCallback(() => {
    const next = (randomIndex + 1) % rcPresets.length
    setRandomIndex(next)
    applyPreset(rcPresets[next])
  }, [randomIndex])

  async function handleSave() {
    setSaving(true)
    const res = await fetch("/api/admin/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(colors),
    })
    if (res.ok) {
      injectTheme(colors)
      toast.success("Tema kaydedildi!")
    } else {
      toast.error("Tema kaydedilemedi")
    }
    setSaving(false)
  }

  function ColorRow({ label, k }: { label: string; k: ThemeKey }) {
    return (
      <div className="flex items-center justify-between py-2 border-b last:border-0">
        <Label className="text-sm">{label}</Label>
        <div className="flex items-center gap-2">
          <div className="h-6 w-10 rounded border" style={{ backgroundColor: colors[k] }} />
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

  const current = colors

  return (
    <div className="space-y-6 pb-10">
      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tema Yönetimi</h1>
          <p className="text-muted-foreground">RC araç mağazanızın görünümünü özelleştirin</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRandom} className="gap-2">
            <Shuffle className="size-4" />
            Rastgele
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="size-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      {/* Tema Seçici Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5" />
            RC Araç Temaları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {rcPresets.map((preset) => {
              const isSelected = selectedPreset === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="relative rounded-xl overflow-hidden border-2 transition-all duration-200 hover:scale-[1.03] text-left"
                  style={{
                    borderColor: isSelected ? preset.colors.primary : "transparent",
                    boxShadow: isSelected ? `0 0 0 2px ${preset.colors.primary}44` : "none",
                    background: preset.colors.bg_page,
                  }}
                >
                  {/* Seçili işareti */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 rounded-full p-0.5" style={{ background: preset.colors.primary }}>
                      <Check className="size-3 text-black" />
                    </div>
                  )}
                  {/* Mini önizleme */}
                  <div className="p-2 space-y-1.5">
                    {/* Header şeridi */}
                    <div className="h-4 rounded-sm flex items-center px-1.5 gap-1" style={{ background: preset.colors.bg_header }}>
                      <div className="size-1.5 rounded-full" style={{ background: preset.colors.primary }} />
                      <div className="h-1 flex-1 rounded-sm opacity-40" style={{ background: preset.colors.text_primary }} />
                    </div>
                    {/* Kart */}
                    <div className="rounded-sm p-1.5" style={{ background: preset.colors.bg_card, border: `1px solid ${preset.colors.primary}33` }}>
                      <div className="h-1 w-full rounded-sm mb-1 opacity-60" style={{ background: preset.colors.text_heading }} />
                      <div className="h-1.5 w-1/2 rounded-sm" style={{ background: preset.colors.primary }} />
                      <div className="mt-1.5 h-3 rounded-sm" style={{ background: preset.colors.btn_primary_bg }} />
                    </div>
                    {/* Renk noktaları */}
                    <div className="flex gap-1 justify-center">
                      {[preset.colors.primary, preset.colors.bg_card, preset.colors.accent].map((c, i) => (
                        <div key={i} className="size-2.5 rounded-full border border-white/20" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  {/* İsim */}
                  <div className="px-2 pb-2">
                    <div className="text-xs font-bold leading-tight" style={{ color: preset.colors.primary }}>
                      {preset.name}
                    </div>
                    <div className="text-[10px] opacity-50 truncate" style={{ color: preset.colors.text_secondary }}>
                      {preset.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Rastgele Butonu Büyük */}
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={handleRandom} size="lg" className="gap-3 px-8">
              <Shuffle className="size-5" />
              Rastgele Tema Dene
              <span className="text-xs opacity-50 font-normal">her tıkta değişir</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Canlı Önizleme + Editör */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Editör */}
        <div className="lg:col-span-2 space-y-4">
          <button
            onClick={() => setShowEditor(!showEditor)}
            className="flex items-center justify-between w-full rounded-xl border px-5 py-3 font-semibold hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Palette className="size-4" />
              Gelişmiş Renk Editörü
              <span className="text-xs font-normal text-muted-foreground">(ince ayar)</span>
            </span>
            {showEditor ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showEditor && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Ana Renkler</CardTitle></CardHeader>
                <CardContent>
                  <ColorRow label="Primary" k="primary" />
                  <ColorRow label="Secondary" k="secondary" />
                  <ColorRow label="Accent" k="accent" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Arka Planlar</CardTitle></CardHeader>
                <CardContent>
                  <ColorRow label="Sayfa" k="bg_page" />
                  <ColorRow label="Kart" k="bg_card" />
                  <ColorRow label="Header" k="bg_header" />
                  <ColorRow label="Footer" k="bg_footer" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Metinler</CardTitle></CardHeader>
                <CardContent>
                  <ColorRow label="Ana Metin" k="text_primary" />
                  <ColorRow label="İkincil Metin" k="text_secondary" />
                  <ColorRow label="Başlık" k="text_heading" />
                  <ColorRow label="Link" k="text_link" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Butonlar</CardTitle></CardHeader>
                <CardContent>
                  <ColorRow label="Primary Arka Plan" k="btn_primary_bg" />
                  <ColorRow label="Primary Metin" k="btn_primary_text" />
                  <ColorRow label="Secondary Arka Plan" k="btn_secondary_bg" />
                  <ColorRow label="Secondary Metin" k="btn_secondary_text" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Özel Renkler</CardTitle></CardHeader>
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setColors(rcPresets[7].colors); setSelectedPreset("fire") }} className="gap-2">
                  <RotateCcw className="size-3.5" />
                  Ateş Temasına Dön
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="size-4" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Canlı Önizleme */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Canlı Önizleme
                {selectedPreset && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {rcPresets.find(p => p.id === selectedPreset)?.name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl overflow-hidden text-xs shadow-inner"
                style={{ background: current.bg_page, border: `1px solid ${current.primary}22` }}
              >
                {/* Header */}
                <div className="px-3 py-2 flex items-center justify-between" style={{ background: current.bg_header }}>
                  <span className="font-black text-sm tracking-wide" style={{ color: current.primary }}>
                    Cihan Ekspress
                  </span>
                  <div className="flex gap-1.5">
                    <div className="size-1.5 rounded-full opacity-60" style={{ background: current.text_secondary }} />
                    <div className="size-1.5 rounded-full opacity-60" style={{ background: current.text_secondary }} />
                    <div className="size-1.5 rounded-full opacity-60" style={{ background: current.text_secondary }} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2.5">
                  {/* Hero label */}
                  <div className="flex items-center gap-1.5">
                    <div className="h-0.5 w-3" style={{ background: current.primary }} />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: current.primary }}>
                      RC Koleksiyon
                    </span>
                  </div>
                  <div className="text-base font-black leading-none" style={{ color: current.text_heading }}>
                    Yeni Gelenler
                  </div>

                  {/* Ürün kartları */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "Traxxas Slash", price: "2.499 ₺", badge: "Yeni" },
                      { name: "Kyosho Inferno", price: "5.999 ₺", badge: "%20" },
                    ].map((item) => (
                      <div key={item.name} className="rounded-lg overflow-hidden" style={{ background: current.bg_card, border: `1px solid ${current.primary}22` }}>
                        <div className="h-10" style={{ background: `${current.primary}18` }}>
                          <div className="h-full flex items-center justify-center">
                            <div className="size-5 opacity-30" style={{ background: current.primary, borderRadius: "50%" }} />
                          </div>
                        </div>
                        <div className="p-1.5">
                          <div className="text-[9px] mb-0.5" style={{ color: current.text_primary }}>{item.name}</div>
                          <div className="font-black text-[10px] mb-1" style={{ color: current.primary }}>{item.price}</div>
                          <div
                            className="text-[8px] text-center rounded py-0.5 font-bold"
                            style={{ background: current.btn_primary_bg, color: current.btn_primary_text }}
                          >
                            Sepete Ekle
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Badges row */}
                  <div className="flex gap-1 flex-wrap">
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: current.color_new_badge, color: "#fff" }}>
                      Yeni
                    </span>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: current.color_discount_badge, color: "#fff" }}>
                      %20 İndirim
                    </span>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: current.color_whatsapp, color: "#fff" }}>
                      WhatsApp
                    </span>
                  </div>

                  {/* Secondary button */}
                  <div
                    className="text-center py-1.5 rounded-lg text-[9px] font-bold"
                    style={{ background: current.btn_secondary_bg, color: current.btn_secondary_text, border: `1px solid ${current.primary}33` }}
                  >
                    Tüm Ürünleri Gör →
                  </div>
                </div>

                {/* Footer */}
                <div className="px-3 py-2 text-center" style={{ background: current.bg_footer }}>
                  <span className="text-[8px]" style={{ color: current.text_secondary }}>© 2025 Cihan Ekspress</span>
                </div>
              </div>

              {/* Renk paleti */}
              <div className="mt-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Aktif Palet</div>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { k: "primary", label: "Ana" },
                    { k: "accent", label: "Accent" },
                    { k: "bg_page", label: "Sayfa" },
                    { k: "bg_card", label: "Kart" },
                    { k: "bg_header", label: "Header" },
                    { k: "text_primary", label: "Metin" },
                  ].map(({ k, label }) => (
                    <div key={k} className="flex flex-col items-center gap-0.5">
                      <div
                        className="size-6 rounded-full border border-white/20 shadow-sm"
                        style={{ background: current[k as ThemeKey] }}
                        title={`${label}: ${current[k as ThemeKey]}`}
                      />
                      <span className="text-[8px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
