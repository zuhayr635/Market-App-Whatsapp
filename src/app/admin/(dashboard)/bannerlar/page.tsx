"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react"

interface Banner {
  id: string
  title: string | null
  subtitle: string | null
  image: string
  buttonText: string | null
  buttonLink: string | null
  startDate: string | null
  endDate: string | null
  sortOrder: number
  status: boolean
  position: string
}

const defaultForm = {
  title: "",
  subtitle: "",
  image: "",
  buttonText: "",
  buttonLink: "",
  startDate: "",
  endDate: "",
  sortOrder: 0,
  status: true,
  position: "homepage",
}

export default function BannerlarPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)

  async function fetchBanners() {
    setLoading(true)
    const res = await fetch("/api/admin/banners")
    if (res.ok) {
      const data = await res.json()
      setBanners(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  function openAdd() {
    setEditBanner(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  function openEdit(banner: Banner) {
    setEditBanner(banner)
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image: banner.image,
      buttonText: banner.buttonText || "",
      buttonLink: banner.buttonLink || "",
      startDate: banner.startDate ? banner.startDate.slice(0, 10) : "",
      endDate: banner.endDate ? banner.endDate.slice(0, 10) : "",
      sortOrder: banner.sortOrder,
      status: banner.status,
      position: banner.position,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const url = editBanner ? `/api/admin/banners/${editBanner.id}` : "/api/admin/banners"
    const method = editBanner ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setDialogOpen(false)
      await fetchBanners()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu banneri silmek istediğinizden emin misiniz?")) return
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" })
    await fetchBanners()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bannerlar</h1>
          <p className="text-muted-foreground">Slider ve banner yönetimi</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Banner Ekle
        </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editBanner ? "Banner Düzenle" : "Yeni Banner Ekle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Başlık</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Banner başlığı"
                />
              </div>
              <div className="space-y-1">
                <Label>Alt Başlık</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Alt başlık"
                />
              </div>
              <div className="space-y-1">
                <Label>Görsel URL <span className="text-red-500">*</span></Label>
                <Input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1">
                <Label>Buton Metni</Label>
                <Input
                  value={form.buttonText}
                  onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                  placeholder="Alışverişe Başla"
                />
              </div>
              <div className="space-y-1">
                <Label>Buton Linki</Label>
                <Input
                  value={form.buttonLink}
                  onChange={(e) => setForm({ ...form, buttonLink: e.target.value })}
                  placeholder="/urunler"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Başlangıç Tarihi</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Konum</Label>
                  <select
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                  >
                    <option value="homepage">Ana Sayfa</option>
                    <option value="category">Kategori</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Sıralama</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Durum</Label>
                <select
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm"
                  value={form.status ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, status: e.target.value === "true" })}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.image}>
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">Yükleniyor...</div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 mb-3 opacity-20" />
          <p>Henüz banner eklenmemiş</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Önizleme</th>
                <th className="text-left p-3 font-medium">Başlık</th>
                <th className="text-left p-3 font-medium">Konum</th>
                <th className="text-left p-3 font-medium">Durum</th>
                <th className="text-left p-3 font-medium">Tarih Aralığı</th>
                <th className="text-left p-3 font-medium">Sıra</th>
                <th className="text-right p-3 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3">
                    {banner.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.image}
                        alt={banner.title || "banner"}
                        className="h-14 w-24 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="h-14 w-24 bg-gray-100 rounded flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{banner.title || "—"}</p>
                    {banner.subtitle && (
                      <p className="text-xs text-muted-foreground">{banner.subtitle}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="capitalize">{banner.position === "homepage" ? "Ana Sayfa" : "Kategori"}</span>
                  </td>
                  <td className="p-3">
                    <Badge variant={banner.status ? "default" : "secondary"}>
                      {banner.status ? "Aktif" : "Pasif"}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {banner.startDate
                      ? new Date(banner.startDate).toLocaleDateString("tr-TR")
                      : "—"}
                    {" – "}
                    {banner.endDate
                      ? new Date(banner.endDate).toLocaleDateString("tr-TR")
                      : "—"}
                  </td>
                  <td className="p-3">{banner.sortOrder}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(banner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(banner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
