"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, GripVertical, HelpCircle } from "lucide-react"
import { toast } from "sonner"

interface Faq {
  id: string
  question: string
  answer: string
  sortOrder: number
  status: boolean
}

const emptyForm = { question: "", answer: "", sortOrder: 0, status: true }

export default function AdminSssPage() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ open: boolean; faq: Partial<Faq> | null }>({
    open: false,
    faq: null,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchFaqs()
  }, [])

  async function fetchFaqs() {
    try {
      const res = await fetch("/api/admin/faqs")
      if (res.ok) {
        const data = await res.json()
        setFaqs(data.faqs || [])
      }
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setDialog({ open: true, faq: { ...emptyForm, sortOrder: faqs.length } })
  }

  function openEdit(faq: Faq) {
    setDialog({ open: true, faq: { ...faq } })
  }

  async function saveFaq() {
    if (!dialog.faq) return
    const { question, answer } = dialog.faq
    if (!question || !answer) {
      toast.error("Soru ve cevap alanları zorunludur")
      return
    }
    setSaving(true)
    try {
      const isEdit = !!dialog.faq.id
      const res = await fetch(
        isEdit ? `/api/admin/faqs/${dialog.faq.id}` : "/api/admin/faqs",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dialog.faq),
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (isEdit) {
          setFaqs((prev) => prev.map((f) => (f.id === data.faq.id ? data.faq : f)))
        } else {
          setFaqs((prev) => [...prev, data.faq])
        }
        toast.success(isEdit ? "SSS güncellendi" : "SSS eklendi")
        setDialog({ open: false, faq: null })
      } else {
        const err = await res.json()
        toast.error(err.error || "Bir hata oluştu")
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteFaq(id: string) {
    if (!confirm("Bu SSS girişini silmek istediğinize emin misiniz?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" })
      if (res.ok) {
        setFaqs((prev) => prev.filter((f) => f.id !== id))
        toast.success("SSS silindi")
      } else {
        toast.error("Silinemedi")
      }
    } finally {
      setDeleting(null)
    }
  }

  async function toggleStatus(faq: Faq) {
    try {
      await fetch(`/api/admin/faqs/${faq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !faq.status }),
      })
      setFaqs((prev) => prev.map((f) => (f.id === faq.id ? { ...f, status: !faq.status } : f)))
    } catch {
      toast.error("Durum güncellenemedi")
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16 text-muted-foreground">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sıkça Sorulan Sorular</h1>
          <p className="text-muted-foreground">SSS sayfasını yönetin</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni SSS Ekle
        </Button>
      </div>

      {faqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <HelpCircle className="mb-3 h-10 w-10" />
          <p>Henüz SSS eklenmemiş</p>
          <Button variant="outline" className="mt-3" onClick={openNew}>
            İlk SSS&apos;yi Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <Card key={faq.id} className={!faq.status ? "opacity-60" : ""}>
              <CardContent className="flex items-start gap-3 py-3 px-4">
                <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{faq.question}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground mr-2">#{index + 1}</span>
                  <button
                    onClick={() => toggleStatus(faq)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      faq.status
                        ? "border-green-200 text-green-700 bg-green-50"
                        : "border-gray-200 text-gray-500 bg-gray-50"
                    }`}
                  >
                    {faq.status ? "Aktif" : "Pasif"}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(faq)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600"
                    onClick={() => deleteFaq(faq.id)}
                    disabled={deleting === faq.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(o) => !o && setDialog({ open: false, faq: null })}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.faq?.id ? "SSS Düzenle" : "Yeni SSS Ekle"}</DialogTitle>
          </DialogHeader>
          {dialog.faq && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Soru</Label>
                <Input
                  value={dialog.faq.question || ""}
                  onChange={(e) =>
                    setDialog((prev) => ({
                      ...prev,
                      faq: { ...prev.faq!, question: e.target.value },
                    }))
                  }
                  placeholder="Sıkça sorulan soru..."
                />
              </div>
              <div className="space-y-1">
                <Label>Cevap</Label>
                <Textarea
                  value={dialog.faq.answer || ""}
                  onChange={(e) =>
                    setDialog((prev) => ({
                      ...prev,
                      faq: { ...prev.faq!, answer: e.target.value },
                    }))
                  }
                  rows={4}
                  placeholder="Soruya cevap..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Sıra No</Label>
                  <Input
                    type="number"
                    value={dialog.faq.sortOrder ?? 0}
                    onChange={(e) =>
                      setDialog((prev) => ({
                        ...prev,
                        faq: { ...prev.faq!, sortOrder: parseInt(e.target.value) || 0 },
                      }))
                    }
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dialog.faq.status !== false}
                      onChange={(e) =>
                        setDialog((prev) => ({
                          ...prev,
                          faq: { ...prev.faq!, status: e.target.checked },
                        }))
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Aktif</span>
                  </label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog({ open: false, faq: null })}
            >
              İptal
            </Button>
            <Button onClick={saveFaq} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
