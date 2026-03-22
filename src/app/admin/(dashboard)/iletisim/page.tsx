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
import { Mail, MailOpen, MessageSquare, Reply } from "lucide-react"
import { toast } from "sonner"

interface ContactForm {
  id: string
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  isReplied: boolean
  createdAt: string
}

export default function AdminIletisimPage() {
  const [forms, setForms] = useState<ContactForm[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ContactForm | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchForms()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function fetchForms() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/contact?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setForms(data.forms || [])
        setTotal(data.total || 0)
      }
    } finally {
      setLoading(false)
    }
  }

  async function markRead(id: string) {
    try {
      await fetch("/api/admin/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      })
      setForms((prev) => prev.map((f) => (f.id === id ? { ...f, isRead: true } : f)))
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, isRead: true } : null)
      toast.success("Okundu olarak işaretlendi")
    } catch {
      toast.error("Bir hata oluştu")
    }
  }

  async function markReplied(id: string) {
    try {
      await fetch("/api/admin/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isReplied: true }),
      })
      setForms((prev) => prev.map((f) => (f.id === id ? { ...f, isReplied: true } : f)))
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, isReplied: true } : null)
      toast.success("Yanıtlandı olarak işaretlendi")
    } catch {
      toast.error("Bir hata oluştu")
    }
  }

  function openForm(form: ContactForm) {
    setSelected(form)
    if (!form.isRead) markRead(form.id)
  }

  if (loading && forms.length === 0) {
    return <div className="flex justify-center py-16 text-muted-foreground">Yükleniyor...</div>
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">İletişim Formları</h1>
        <p className="text-muted-foreground">Müşteri mesajlarını yönetin ({total} toplam)</p>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <MessageSquare className="mb-3 h-10 w-10" />
          <p>Henüz mesaj yok</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Ad Soyad</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">E-posta</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Konu</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tarih</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Durum</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr
                  key={form.id}
                  className={`border-b hover:bg-gray-50 cursor-pointer transition-colors ${!form.isRead ? "bg-blue-50" : ""}`}
                  onClick={() => openForm(form)}
                >
                  <td className="px-4 py-3 font-medium">
                    {!form.isRead && (
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-2" />
                    )}
                    {form.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{form.email}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{form.subject}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(form.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {form.isRead ? (
                        <Badge variant="outline" className="text-xs">Okundu</Badge>
                      ) : (
                        <Badge className="bg-blue-500 text-xs">Yeni</Badge>
                      )}
                      {form.isReplied && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">Yanıtlandı</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`mailto:${form.email}?subject=Re: ${encodeURIComponent(form.subject)}`}
                      onClick={() => markReplied(form.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <Reply className="h-4 w-4" />
                      Yanıtla
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Önceki
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki
          </Button>
        </div>
      )}

      {/* Message detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.subject}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Gönderen:</span> <strong>{selected.name}</strong></p>
                <p><span className="text-muted-foreground">E-posta:</span> {selected.email}</p>
                <p><span className="text-muted-foreground">Tarih:</span> {new Date(selected.createdAt).toLocaleString("tr-TR")}</p>
              </div>
              <div className="rounded-lg border p-3 text-sm whitespace-pre-wrap">
                {selected.message}
              </div>
              <div className="flex gap-2">
                {!selected.isRead && (
                  <Button variant="outline" size="sm" onClick={() => markRead(selected.id)}>
                    <MailOpen className="h-4 w-4 mr-2" />
                    Okundu İşaretle
                  </Button>
                )}
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  onClick={() => markReplied(selected.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  E-posta ile Yanıtla
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
