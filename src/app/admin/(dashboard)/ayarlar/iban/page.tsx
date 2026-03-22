"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface IbanInfo {
  id: string
  bankName: string
  iban: string
  accountHolder: string
  branchCode: string | null
  currency: string
  sortOrder: number
  status: boolean
}

const emptyForm = {
  bankName: "",
  iban: "",
  accountHolder: "",
  branchCode: "",
  currency: "TRY",
  sortOrder: 0,
  status: true,
}

export default function IbanSettingsPage() {
  const [ibans, setIbans] = useState<IbanInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<IbanInfo | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/iban")
      if (res.ok) setIbans(await res.json())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (iban: IbanInfo) => {
    setEditing(iban)
    setForm({
      bankName: iban.bankName,
      iban: iban.iban,
      accountHolder: iban.accountHolder,
      branchCode: iban.branchCode || "",
      currency: iban.currency,
      sortOrder: iban.sortOrder,
      status: iban.status,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.bankName || !form.iban || !form.accountHolder) {
      toast.error("Banka adı, IBAN ve hesap sahibi zorunludur")
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch(`/api/admin/iban/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success("IBAN güncellendi")
      } else {
        const res = await fetch("/api/admin/iban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success("IBAN eklendi")
      }
      setDialogOpen(false)
      load()
    } catch {
      toast.error("Kayıt başarısız")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu IBAN bilgisini silmek istediğinizden emin misiniz?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/iban/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("IBAN silindi")
      load()
    } catch {
      toast.error("Silme başarısız")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">IBAN Ayarları</h1>
          <p className="text-sm text-muted-foreground">Ödeme için banka hesap bilgilerini yönetin</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          IBAN Ekle
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : ibans.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
          Henüz IBAN bilgisi eklenmemiş.
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          {ibans.map((iban, idx) => (
            <div
              key={iban.id}
              className={`flex items-center justify-between gap-4 px-4 py-3 ${
                idx !== ibans.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{iban.bankName}</p>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {iban.currency}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      iban.status
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {iban.status ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <p className="font-mono text-sm text-muted-foreground">{iban.iban}</p>
                <p className="text-sm text-muted-foreground">{iban.accountHolder}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(iban)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deleting === iban.id}
                  onClick={() => handleDelete(iban.id)}
                >
                  {deleting === iban.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "IBAN Düzenle" : "IBAN Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Banka Adı *</Label>
              <Input
                className="mt-1"
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                placeholder="Örn: Ziraat Bankası"
              />
            </div>
            <div>
              <Label>IBAN *</Label>
              <Input
                className="mt-1 font-mono"
                value={form.iban}
                onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
            </div>
            <div>
              <Label>Hesap Sahibi *</Label>
              <Input
                className="mt-1"
                value={form.accountHolder}
                onChange={(e) => setForm((f) => ({ ...f, accountHolder: e.target.value }))}
                placeholder="Ad Soyad / Şirket Adı"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Para Birimi</Label>
                <select
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <Label>Sıra</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label>Şube Kodu (İsteğe Bağlı)</Label>
              <Input
                className="mt-1"
                value={form.branchCode}
                onChange={(e) => setForm((f) => ({ ...f, branchCode: e.target.value }))}
                placeholder="Şube kodu"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="iban-status"
                checked={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))}
                className="accent-primary"
              />
              <Label htmlFor="iban-status" className="cursor-pointer">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
