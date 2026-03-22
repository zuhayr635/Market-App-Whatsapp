"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft } from "lucide-react"
import { toast } from "sonner"

interface PageData {
  id: string
  title: string
  slug: string
  content: string
  seoTitle: string | null
  seoDesc: string | null
  status: boolean
}

const defaultTitles: Record<string, string> = {
  hakkimizda: "Hakkımızda",
  gizlilik: "Gizlilik Politikası",
  kvkk: "KVKK Aydınlatma Metni",
  "kullanim-kosullari": "Kullanım Koşulları",
  "iade-kosullari": "İade ve Değişim Koşulları",
  "kargo-bilgileri": "Kargo Bilgileri",
}

export default function PageEditorPage() {
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{
    title: string
    content: string
    seoTitle: string
    seoDesc: string
    status: boolean
  }>({
    title: defaultTitles[slug] ?? slug,
    content: "",
    seoTitle: "",
    seoDesc: "",
    status: true,
  })

  useEffect(() => {
    fetchPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function fetchPage() {
    try {
      const res = await fetch(`/api/admin/pages/${slug}`)
      if (res.ok) {
        const data = await res.json()
        const page: PageData = data.page
        setForm({
          title: page.title,
          content: page.content,
          seoTitle: page.seoTitle ?? "",
          seoDesc: page.seoDesc ?? "",
          status: page.status,
        })
      }
      // If 404, form already has sensible defaults from state initializer
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Başlık alanı zorunludur")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          seoTitle: form.seoTitle || null,
          seoDesc: form.seoDesc || null,
          status: form.status,
        }),
      })
      if (res.ok) {
        toast.success("Sayfa kaydedildi")
      } else {
        const err = await res.json()
        toast.error(err.error || "Bir hata oluştu")
      }
    } catch {
      toast.error("Sunucuya ulaşılamadı")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16 text-muted-foreground">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/sayfalar"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Geri
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Sayfa Düzenle: {form.title}</h1>
          <p className="text-sm text-muted-foreground">Slug: {slug}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sayfa İçeriği</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Sayfa başlığı..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">İçerik</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={20}
                  placeholder="Sayfa içeriğini buraya yazın..."
                  className="font-mono text-sm resize-y"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Durum</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.status}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-medium">
                  {form.status ? "Aktif" : "Pasif"}
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                {form.status
                  ? "Sayfa ziyaretçilere görünür."
                  : "Sayfa ziyaretçilere görünmüyor."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="seoTitle">SEO Başlık</Label>
                <Input
                  id="seoTitle"
                  value={form.seoTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="Arama motoru başlığı..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seoDesc">SEO Açıklama</Label>
                <Textarea
                  id="seoDesc"
                  value={form.seoDesc}
                  onChange={(e) => setForm((prev) => ({ ...prev, seoDesc: e.target.value }))}
                  rows={4}
                  placeholder="Meta açıklama..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
