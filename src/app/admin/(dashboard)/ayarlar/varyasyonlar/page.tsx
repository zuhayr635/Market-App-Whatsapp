"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Palette,
  X,
} from "lucide-react"

// ---------- Types ----------

interface VariationValue {
  id?: string
  value: string
  colorCode?: string | null
  image?: string | null
  sortOrder: number
  status: boolean
}

interface VariationType {
  id: string
  name: string
  displayType: string
  sortOrder: number
  status: boolean
  values: VariationValue[]
}

// ---------- Helpers ----------

const selectClass =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const displayTypeLabel: Record<string, string> = {
  dropdown: "Dropdown",
  color_swatch: "Renk Paleti",
  button: "Buton",
}

// ---------- Page ----------

export default function VaryasyonlarPage() {
  const [types, setTypes] = useState<VariationType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<VariationType | null>(null)
  const [deletingType, setDeletingType] = useState<VariationType | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState("")
  const [formDisplayType, setFormDisplayType] = useState("dropdown")
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [formStatus, setFormStatus] = useState(true)
  const [formValues, setFormValues] = useState<VariationValue[]>([])

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/variations")
      if (res.ok) {
        const data = await res.json()
        setTypes(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTypes()
  }, [fetchTypes])

  const resetForm = () => {
    setFormName("")
    setFormDisplayType("dropdown")
    setFormSortOrder(0)
    setFormStatus(true)
    setFormValues([])
  }

  const openCreateDialog = () => {
    setEditingType(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (type: VariationType) => {
    setEditingType(type)
    setFormName(type.name)
    setFormDisplayType(type.displayType)
    setFormSortOrder(type.sortOrder)
    setFormStatus(type.status)
    setFormValues(
      type.values.map((v) => ({
        id: v.id,
        value: v.value,
        colorCode: v.colorCode,
        image: v.image,
        sortOrder: v.sortOrder,
        status: v.status,
      }))
    )
    setDialogOpen(true)
  }

  const openDeleteDialog = (type: VariationType) => {
    setDeletingType(type)
    setDeleteDialogOpen(true)
  }

  const handleAddValue = () => {
    setFormValues((prev) => [
      ...prev,
      {
        value: "",
        colorCode: null,
        image: null,
        sortOrder: prev.length,
        status: true,
      },
    ])
  }

  const handleUpdateValue = (
    index: number,
    field: keyof VariationValue,
    value: string | number | boolean | null
  ) => {
    setFormValues((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
  }

  const handleRemoveValue = (index: number) => {
    setFormValues((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error("Ad alanı zorunludur")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: formName.trim(),
        displayType: formDisplayType,
        sortOrder: formSortOrder,
        status: formStatus,
        values: formValues
          .filter((v) => v.value.trim())
          .map((v, i) => ({
            ...(v.id ? { id: v.id } : {}),
            value: v.value.trim(),
            colorCode: v.colorCode || null,
            image: v.image || null,
            sortOrder: v.sortOrder ?? i,
          })),
      }

      const url = editingType
        ? `/api/admin/variations/${editingType.id}`
        : "/api/admin/variations"
      const method = editingType ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setDialogOpen(false)
        fetchTypes()
        toast.success(
          editingType ? "Varyasyon tipi güncellendi" : "Varyasyon tipi oluşturuldu"
        )
      } else {
        const err = await res.json()
        toast.error(err.error || "Hata oluştu")
      }
    } catch {
      toast.error("Hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingType) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/variations/${deletingType.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDeleteDialogOpen(false)
        setDeletingType(null)
        fetchTypes()
        toast.success("Varyasyon tipi silindi")
      } else {
        const err = await res.json()
        toast.error(err.error || "Silme başarısız")
      }
    } catch {
      toast.error("Hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Varyasyon Tipleri</h1>
          <p className="text-sm text-muted-foreground">
            Ürün varyasyonları için tip ve değerleri yönetin
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4 mr-2" />
          Yeni Varyasyon Tipi
        </Button>
      </div>

      {/* List */}
      <div className="rounded-lg border bg-white">
        {/* Table header */}
        <div className="flex items-center gap-3 border-b px-4 py-2.5 bg-gray-50/50">
          <div className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Varyasyon Tipi
          </div>
          <div className="w-32 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Görünüm
          </div>
          <div className="w-20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Değerler
          </div>
          <div className="w-16" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : types.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Palette className="size-10 mb-3" />
            <p className="text-sm">Henüz varyasyon tipi eklenmemiş</p>
          </div>
        ) : (
          types.map((type) => (
            <div
              key={type.id}
              className="flex items-center gap-3 border-b px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{type.name}</span>
                  <Badge
                    variant={type.status ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {type.status ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                {/* Show values preview */}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {type.values.slice(0, 8).map((v) => (
                    <span
                      key={v.id || v.value}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
                    >
                      {type.displayType === "color_swatch" && v.colorCode && (
                        <span
                          className="inline-block size-2.5 rounded-full border border-gray-200"
                          style={{ backgroundColor: v.colorCode }}
                        />
                      )}
                      {v.value}
                    </span>
                  ))}
                  {type.values.length > 8 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{type.values.length - 8}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-32 text-xs text-muted-foreground">
                {displayTypeLabel[type.displayType] || type.displayType}
              </div>
              <div className="w-20 text-xs text-muted-foreground">
                {type.values.length} değer
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEditDialog(type)}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openDeleteDialog(type)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Varyasyon Tipi Düzenle" : "Yeni Varyasyon Tipi"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "Varyasyon tipi bilgilerini güncelleyin"
                : "Yeni bir varyasyon tipi oluşturun"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Ad *</Label>
              <Input
                placeholder="Örn: Renk, Beden, Malzeme"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* Display Type */}
            <div className="space-y-1.5">
              <Label>Görünüm Tipi</Label>
              <select
                className={selectClass}
                value={formDisplayType}
                onChange={(e) => setFormDisplayType(e.target.value)}
              >
                <option value="dropdown">Dropdown</option>
                <option value="color_swatch">Renk Paleti</option>
                <option value="button">Buton</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <Label>Sıralama</Label>
              <Input
                type="number"
                value={formSortOrder}
                onChange={(e) =>
                  setFormSortOrder(parseInt(e.target.value, 10) || 0)
                }
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formStatus}
                onCheckedChange={(checked: boolean) => setFormStatus(checked)}
              />
              <Label>Aktif</Label>
            </div>

            {/* Values */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Değerler</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddValue}
                >
                  <Plus className="size-3 mr-1" />
                  Değer Ekle
                </Button>
              </div>

              {formValues.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Henüz değer eklenmemiş
                </p>
              ) : (
                <div className="space-y-2">
                  {formValues.map((v, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded border p-2"
                    >
                      <div className="flex-1">
                        <Input
                          placeholder="Değer adı"
                          className="h-7 text-xs"
                          value={v.value}
                          onChange={(e) =>
                            handleUpdateValue(index, "value", e.target.value)
                          }
                        />
                      </div>
                      {formDisplayType === "color_swatch" && (
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={v.colorCode || "#000000"}
                            onChange={(e) =>
                              handleUpdateValue(
                                index,
                                "colorCode",
                                e.target.value
                              )
                            }
                            className="h-7 w-7 rounded border cursor-pointer"
                          />
                          <Input
                            placeholder="#000000"
                            className="h-7 text-xs w-24"
                            value={v.colorCode || ""}
                            onChange={(e) =>
                              handleUpdateValue(
                                index,
                                "colorCode",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}
                      <Input
                        type="number"
                        placeholder="Sıra"
                        className="h-7 text-xs w-16"
                        value={v.sortOrder}
                        onChange={(e) =>
                          handleUpdateValue(
                            index,
                            "sortOrder",
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveValue(index)}
                      >
                        <X className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Color Swatch Preview */}
              {formDisplayType === "color_swatch" &&
                formValues.some((v) => v.colorCode) && (
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs text-muted-foreground">
                      Renk Önizleme
                    </Label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {formValues
                        .filter((v) => v.value && v.colorCode)
                        .map((v, i) => (
                          <div
                            key={i}
                            className="flex flex-col items-center gap-0.5"
                          >
                            <span
                              className="size-8 rounded-full border-2 border-gray-200 shadow-sm"
                              style={{
                                backgroundColor: v.colorCode || "#000",
                              }}
                            />
                            <span className="text-[10px] text-muted-foreground">
                              {v.value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              disabled={submitting || !formName.trim()}
              onClick={handleSubmit}
            >
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              {editingType ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Varyasyon Tipi Sil</DialogTitle>
            <DialogDescription>
              <strong>{deletingType?.name}</strong> varyasyon tipini ve tüm
              değerlerini silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
