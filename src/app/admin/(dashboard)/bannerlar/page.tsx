"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Play, Image, Eye, EyeOff } from "lucide-react"

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?]+)/)
  return m ? m[1] : null
}
import { toast } from "sonner"

interface Banner {
  id: string
  title: string | null
  subtitle: string | null
  image: string
  mediaType: string
  buttonText: string | null
  buttonLink: string | null
  duration: number
  sortOrder: number
  status: boolean
}

function detectMediaType(url: string): string {
  const lower = url.toLowerCase()
  if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".ogg")) return "video"
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "video"
  return "image"
}

export default function BannerlarPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  // Quick add form
  const [mediaUrl, setMediaUrl] = useState("")
  const [title, setTitle] = useState("")
  const [adding, setAdding] = useState(false)

  async function fetchBanners() {
    setLoading(true)
    const res = await fetch("/api/admin/banners")
    if (res.ok) setBanners(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchBanners() }, [])

  async function handleQuickAdd() {
    if (!mediaUrl.trim()) return toast.error("URL gerekli")
    setAdding(true)
    const mediaType = detectMediaType(mediaUrl)
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: mediaUrl.trim(),
        mediaType,
        title: title.trim() || null,
        sortOrder: banners.length,
        status: true,
        position: "homepage",
        duration: mediaType === "video" ? 15 : 5,
      }),
    })
    if (res.ok) {
      toast.success("Banner eklendi")
      setMediaUrl("")
      setTitle("")
      await fetchBanners()
    } else {
      toast.error("Eklenemedi")
    }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" })
    toast.success("Silindi")
    await fetchBanners()
  }

  async function toggleStatus(banner: Banner) {
    await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...banner, status: !banner.status }),
    })
    await fetchBanners()
  }

  async function updateField(banner: Banner, field: string, value: any) {
    await fetch(`/api/admin/banners/${banner.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...banner, [field]: value }),
    })
    await fetchBanners()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bannerlar</h1>
        <p className="text-sm text-muted-foreground">Ana sayfa slider yönetimi — resim veya video URL yapıştırın</p>
      </div>

      {/* Quick Add */}
      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hızlı Ekle</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Resim veya video URL yapıştırın..."
              className="h-11"
            />
          </div>
          <div className="w-full sm:w-48">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Başlık (opsiyonel)"
              className="h-11"
            />
          </div>
          <Button onClick={handleQuickAdd} disabled={adding || !mediaUrl.trim()} className="h-11 px-6">
            <Plus className="size-4 mr-1.5" />
            {adding ? "Ekleniyor..." : "Ekle"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Desteklenen: Resim (.jpg, .png, .webp), Video (.mp4, .webm), YouTube linki — Tür otomatik algılanır
        </p>
      </div>

      {/* Banner List */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Yükleniyor...</div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Image className="size-12 mb-3 opacity-20" />
          <p>Henüz banner eklenmemiş</p>
          <p className="text-xs mt-1">Yukarıdan URL yapıştırarak ekleyin</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div key={banner.id} className="flex items-center gap-4 rounded-xl border bg-white p-4 transition-all hover:shadow-sm">
              {/* Preview */}
              <div className="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {(() => {
                  const ytId = getYouTubeId(banner.image)
                  if (ytId) {
                    return (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="size-6 text-white" fill="white" />
                        </div>
                      </>
                    )
                  }
                  if (banner.mediaType === "video") {
                    return (
                      <>
                        <video src={banner.image} className="h-full w-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="size-6 text-white" fill="white" />
                        </div>
                      </>
                    )
                  }
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.image}
                      alt={banner.title || ""}
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  )
                })()}
                <div className="absolute top-1 left-1">
                  {getYouTubeId(banner.image) ? (
                    <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">YT</span>
                  ) : banner.mediaType === "video" ? (
                    <span className="rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white">VIDEO</span>
                  ) : (
                    <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">FOTO</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <input
                  defaultValue={banner.title || ""}
                  placeholder="Başlık ekle..."
                  className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-0"
                  onBlur={(e) => {
                    if (e.target.value !== (banner.title || "")) {
                      updateField(banner, "title", e.target.value || null)
                    }
                  }}
                />
                <input
                  defaultValue={banner.subtitle || ""}
                  placeholder="Alt başlık..."
                  className="w-full border-0 bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/30 focus:ring-0"
                  onBlur={(e) => {
                    if (e.target.value !== (banner.subtitle || "")) {
                      updateField(banner, "subtitle", e.target.value || null)
                    }
                  }}
                />
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[10px] text-muted-foreground">Buton:</label>
                    <input
                      defaultValue={banner.buttonText || ""}
                      placeholder="Metin"
                      className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-[11px] outline-none hover:border-border focus:border-border"
                      onBlur={(e) => updateField(banner, "buttonText", e.target.value || null)}
                    />
                    <input
                      defaultValue={banner.buttonLink || ""}
                      placeholder="/urunler"
                      className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-[11px] outline-none hover:border-border focus:border-border"
                      onBlur={(e) => updateField(banner, "buttonLink", e.target.value || null)}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] text-muted-foreground">Süre:</label>
                    <input
                      type="number"
                      defaultValue={banner.duration}
                      min={2}
                      max={60}
                      className="w-12 rounded border border-transparent bg-transparent px-1 py-0.5 text-center text-[11px] outline-none hover:border-border focus:border-border"
                      onBlur={(e) => updateField(banner, "duration", Number(e.target.value) || 5)}
                    />
                    <span className="text-[10px] text-muted-foreground">sn</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleStatus(banner)}
                  className={`rounded-lg p-2 transition-colors ${banner.status ? "text-green-600 hover:bg-green-50" : "text-stone-400 hover:bg-stone-100"}`}
                  title={banner.status ? "Aktif — tıkla gizle" : "Gizli — tıkla aktif et"}
                >
                  {banner.status ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Sil"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
