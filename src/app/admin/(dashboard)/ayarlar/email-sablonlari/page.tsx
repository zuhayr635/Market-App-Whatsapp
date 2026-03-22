"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Mail, Pencil, Send } from "lucide-react"
import { toast } from "sonner"

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  variables: string | null
}

const templateLabels: Record<string, string> = {
  kayit_basarili: "Kayıt Başarılı",
  email_dogrulama: "E-posta Doğrulama",
  sifre_sifirla: "Şifre Sıfırlama",
  siparis_olusturuldu: "Sipariş Oluşturuldu",
  siparis_durumu_degisti: "Sipariş Durumu Değişti",
  dekont_onaylandi: "Dekont Onaylandı",
  dekont_reddedildi: "Dekont Reddedildi",
  kargoya_verildi: "Kargoya Verildi",
}

export default function EmailSablonlariPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [sendingTest, setSendingTest] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/admin/email-templates")
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveTemplate() {
    if (!editTemplate) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/email-templates/${editTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editTemplate.subject,
          content: editTemplate.content,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates((prev) =>
          prev.map((t) => (t.id === data.template.id ? data.template : t))
        )
        toast.success("Şablon kaydedildi")
        setEditTemplate(null)
      } else {
        toast.error("Kayıt başarısız")
      }
    } finally {
      setSaving(false)
    }
  }

  async function sendTestEmail() {
    if (!editTemplate) return
    setSendingTest(true)
    try {
      const res = await fetch(`/api/admin/email-templates/${editTemplate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", testEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Test e-postası gönderildi: ${data.sentTo}`)
      } else {
        toast.error(data.error || "Gönderi başarısız")
      }
    } finally {
      setSendingTest(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16 text-muted-foreground">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">E-posta Şablonları</h1>
        <p className="text-muted-foreground">
          Otomatik gönderilen e-posta içeriklerini düzenleyin
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => {
          const vars = tpl.variables ? (JSON.parse(tpl.variables) as string[]) : []
          return (
            <Card key={tpl.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                    <CardTitle className="text-sm">
                      {templateLabels[tpl.name] || tpl.name}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setEditTemplate({ ...tpl })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm flex-1">
                <p className="text-muted-foreground line-clamp-1">
                  <span className="font-medium text-foreground">Konu:</span> {tpl.subject}
                </p>
                {vars.length > 0 && (
                  <div>
                    <p className="font-medium text-xs mb-1">Değişkenler:</p>
                    <div className="flex flex-wrap gap-1">
                      {vars.map((v) => (
                        <span
                          key={v}
                          className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono"
                        >
                          {"{" + v + "}"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTemplate} onOpenChange={(o) => !o && setEditTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Şablon Düzenle:{" "}
              {editTemplate ? (templateLabels[editTemplate.name] || editTemplate.name) : ""}
            </DialogTitle>
          </DialogHeader>
          {editTemplate && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Konu</Label>
                <Input
                  value={editTemplate.subject}
                  onChange={(e) =>
                    setEditTemplate({ ...editTemplate, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>HTML İçerik</Label>
                <Textarea
                  value={editTemplate.content}
                  onChange={(e) =>
                    setEditTemplate({ ...editTemplate, content: e.target.value })
                  }
                  rows={12}
                  className="font-mono text-xs"
                />
              </div>
              {editTemplate.variables && (
                <div className="rounded-lg bg-muted p-3 text-xs">
                  <p className="font-medium mb-1">Kullanılabilir değişkenler:</p>
                  <div className="flex flex-wrap gap-1">
                    {(JSON.parse(editTemplate.variables) as string[]).map((v) => (
                      <span key={v} className="rounded bg-white border px-1.5 py-0.5 font-mono">
                        {"{" + v + "}"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2 rounded-lg border p-3">
                <div className="flex-1 space-y-1">
                  <Label>Test E-postası Gönder</Label>
                  <Input
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={sendTestEmail}
                  disabled={sendingTest}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingTest ? "Gönderiliyor..." : "Test Gönder"}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTemplate(null)}>
              İptal
            </Button>
            <Button onClick={saveTemplate} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
