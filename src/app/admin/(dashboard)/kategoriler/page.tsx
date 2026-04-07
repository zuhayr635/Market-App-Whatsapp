"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { categorySchema, type CategoryInput } from "@/lib/validations/category"
import { generateSlug } from "@/lib/utils/slug"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Search,
  ChevronRight,
  FolderTree,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react"

interface CategoryWithChildren {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: string | null
  seoTitle: string | null
  seoDesc: string | null
  sortOrder: number
  status: boolean
  children: CategoryWithChildren[]
  _count: { products: number }
}

let rowCounter = 0
function newRowId() {
  return `row-${++rowCounter}`
}

interface NewCategoryRow {
  id: string
  name: string
  parentId: string
  saved: boolean
  saving: boolean
  error: string
}

function makeRow(): NewCategoryRow {
  return { id: newRowId(), name: "", parentId: "", saved: false, saving: false, error: "" }
}

export default function KategorilerPage() {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategoryWithChildren | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [rows, setRows] = useState<NewCategoryRow[]>([makeRow()])
  const [bulkSaving, setBulkSaving] = useState(false)
  const lastInputRef = useRef<HTMLInputElement>(null)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      parentId: null,
      description: "",
      image: "",
      slug: "",
      seoTitle: "",
      seoDesc: "",
      sortOrder: 0,
      status: true,
    },
  })

  const watchName = watch("name")
  const watchStatus = watch("status")

  const openEditDialog = (category: CategoryWithChildren) => {
    setEditingCategory(category)
    setErrorMessage("")
    reset({
      name: category.name,
      parentId: category.parentId || null,
      description: category.description || "",
      image: category.image || "",
      slug: category.slug,
      seoTitle: category.seoTitle || "",
      seoDesc: category.seoDesc || "",
      sortOrder: category.sortOrder,
      status: category.status,
    })
    setDialogOpen(true)
  }

  const openDeleteDialog = (category: CategoryWithChildren) => {
    setDeletingCategory(category)
    setErrorMessage("")
    setDeleteDialogOpen(true)
  }

  const onSubmit = async (data: CategoryInput) => {
    setSubmitting(true)
    setErrorMessage("")
    try {
      const slug = data.slug || generateSlug(data.name)
      const payload = { ...data, slug }
      const url = `/api/admin/categories/${editingCategory!.id}`
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setDialogOpen(false)
        fetchCategories()
      } else {
        const err = await res.json()
        setErrorMessage(err.error || "Bir hata oluştu")
      }
    } catch {
      setErrorMessage("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    setSubmitting(true)
    setErrorMessage("")
    try {
      const res = await fetch(`/api/admin/categories/${deletingCategory.id}`, { method: "DELETE" })
      if (res.ok) {
        setDeleteDialogOpen(false)
        setDeletingCategory(null)
        fetchCategories()
      } else {
        const err = await res.json()
        setErrorMessage(err.error || "Silme işlemi başarısız")
      }
    } catch {
      setErrorMessage("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  // Row helpers
  const updateRowName = (id: string, name: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name, error: "" } : r)))

  const updateRowParent = (id: string, parentId: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, parentId } : r)))

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))

  const addRow = () => {
    setRows((prev) => [...prev, makeRow()])
    setTimeout(() => lastInputRef.current?.focus(), 50)
  }

  const saveAll = async () => {
    const toSave = rows.filter((r) => r.name.trim() && !r.saved)
    if (toSave.length === 0) return

    setBulkSaving(true)

    // Mark all as saving
    setRows((prev) =>
      prev.map((r) => (toSave.find((s) => s.id === r.id) ? { ...r, saving: true, error: "" } : r))
    )

    const results = await Promise.all(
      toSave.map(async (row) => {
        try {
          const slug = generateSlug(row.name.trim())
          const res = await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: row.name.trim(),
              parentId: row.parentId || null,
              slug,
              description: "",
              image: "",
              seoTitle: "",
              seoDesc: "",
              sortOrder: 0,
              status: true,
            }),
          })
          if (res.ok) return { id: row.id, ok: true, error: "" }
          const err = await res.json()
          return { id: row.id, ok: false, error: err.error || "Hata oluştu" }
        } catch {
          return { id: row.id, ok: false, error: "Bağlantı hatası" }
        }
      })
    )

    setRows((prev) =>
      prev.map((r) => {
        const result = results.find((res) => res.id === r.id)
        if (!result) return r
        return { ...r, saving: false, saved: result.ok, error: result.error }
      })
    )

    setBulkSaving(false)

    const allOk = results.every((r) => r.ok)
    if (allOk) {
      // Clear saved rows after a moment, leave one empty row
      setTimeout(() => {
        setRows([makeRow()])
      }, 1200)
    }

    fetchCategories()
  }

  // Flatten categories for parent select
  const flatCategories: { id: string; name: string; depth: number }[] = []
  const flattenCategories = (cats: CategoryWithChildren[], depth = 0) => {
    for (const cat of cats) {
      flatCategories.push({ id: cat.id, name: cat.name, depth })
      if (cat.children) flattenCategories(cat.children, depth + 1)
    }
  }
  flattenCategories(categories)

  const filterCategories = (cats: CategoryWithChildren[], query: string): CategoryWithChildren[] => {
    if (!query) return cats
    const lower = query.toLowerCase()
    return cats.reduce<CategoryWithChildren[]>((acc, cat) => {
      const childMatches = filterCategories(cat.children || [], query)
      if (cat.name.toLowerCase().includes(lower) || cat.slug.toLowerCase().includes(lower) || childMatches.length > 0) {
        acc.push({ ...cat, children: childMatches })
      }
      return acc
    }, [])
  }

  const filteredCategories = filterCategories(categories, searchQuery)

  const renderCategoryRow = (category: CategoryWithChildren, depth = 0) => (
    <div key={category.id}>
      <div
        className="flex items-center gap-3 border-b px-4 py-3 hover:bg-gray-50 transition-colors"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        {depth > 0 && <ChevronRight className="size-4 text-slate-400" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate text-foreground">{category.name}</span>
            <Badge variant={category.status ? "default" : "secondary"} className="text-[10px]">
              {category.status ? "Aktif" : "Pasif"}
            </Badge>
          </div>
          <span className="text-xs text-slate-400">{category.slug}</span>
        </div>
        <div className="text-xs text-slate-400 whitespace-nowrap">
          {category._count.products} ürün
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(category)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => openDeleteDialog(category)}>
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      {category.children?.map((child) => renderCategoryRow(child, depth + 1))}
    </div>
  )

  const hasUnsaved = rows.some((r) => r.name.trim() && !r.saved)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Kategoriler</h1>
        <p className="text-sm text-slate-400">Ürün kategorilerini yönetin</p>
      </div>

      {/* Bulk Add Panel */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Kategori Ekle</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" type="button" onClick={addRow}>
              <Plus className="size-3.5 mr-1" />
              Satır Ekle
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={saveAll}
              disabled={bulkSaving || !hasUnsaved}
            >
              {bulkSaving && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
              Tümünü Kaydet
            </Button>
          </div>
        </div>

        <div className="divide-y">
          {rows.map((row, idx) => (
            <div key={row.id} className="flex items-center gap-2 px-4 py-2.5">
              {/* Index */}
              <span className="w-5 shrink-0 text-center text-xs text-slate-400">
                {idx + 1}
              </span>

              {/* Name input */}
              <div className="flex-1">
                <input
                  ref={idx === rows.length - 1 ? lastInputRef : undefined}
                  type="text"
                  value={row.name}
                  onChange={(e) => updateRowName(row.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addRow()
                    }
                  }}
                  disabled={row.saving || row.saved}
                  placeholder="Kategori adı..."
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-60"
                />
                {row.error && (
                  <p className="mt-0.5 text-xs text-destructive">{row.error}</p>
                )}
              </div>

              {/* Parent */}
              <select
                value={row.parentId}
                onChange={(e) => updateRowParent(row.id, e.target.value)}
                disabled={row.saving || row.saved}
                className="h-9 w-40 shrink-0 rounded-md border border-input bg-background px-2 text-sm outline-none focus:border-ring disabled:opacity-60"
              >
                <option value="">Ana kategori</option>
                {flatCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {"—".repeat(cat.depth)} {cat.name}
                  </option>
                ))}
              </select>

              {/* Status icon */}
              <div className="w-6 shrink-0 flex items-center justify-center">
                {row.saving && <Loader2 className="size-4 animate-spin text-slate-400" />}
                {row.saved && <CheckCircle2 className="size-4 text-green-500" />}
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1 || row.saving || row.saved}
                className="shrink-0 rounded p-1 text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t px-4 py-2">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary transition-colors py-1"
          >
            <Plus className="size-3.5" />
            Yeni satır ekle (Enter)
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Kategori ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category List */}
      <div className="rounded-lg border bg-white">
        <div className="flex items-center gap-3 border-b px-4 py-2.5 bg-gray-50/50">
          <div className="flex-1 text-xs font-medium text-slate-400 uppercase tracking-wider">Kategori</div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ürünler</div>
          <div className="w-16" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-slate-400" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <FolderTree className="size-10 mb-3" />
            <p className="text-sm">
              {searchQuery ? "Aramanızla eşleşen kategori bulunamadı" : "Henüz kategori eklenmemiş"}
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => renderCategoryRow(cat))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kategori Düzenle</DialogTitle>
            <DialogDescription>Kategori bilgilerini güncelleyin</DialogDescription>
          </DialogHeader>
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Kategori Adı *</Label>
              <Input id="name" {...register("name")} placeholder="Kategori adı" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parentId">Üst Kategori</Label>
              <select
                id="parentId"
                {...register("parentId")}
                className="flex h-8 w-full rounded-lg border border-input px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
                style={{ backgroundColor: '#0E1017', color: '#E2E8F0' }}
              >
                <option value="">Yok (Ana kategori)</option>
                {flatCategories
                  .filter((c) => c.id !== editingCategory?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {"—".repeat(cat.depth)} {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex gap-2">
                <Input id="slug" {...register("slug")} placeholder="otomatik-olusturulur" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { if (watchName) setValue("slug", generateSlug(watchName)) }}
                >
                  Oluştur
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea id="description" {...register("description")} placeholder="Kategori açıklaması" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Sıralama</Label>
              <Input id="sortOrder" type="number" {...register("sortOrder", { valueAsNumber: true })} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seoTitle">SEO Başlık</Label>
              <Input id="seoTitle" {...register("seoTitle")} placeholder="SEO başlığı" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seoDesc">SEO Açıklama</Label>
              <Textarea id="seoDesc" {...register("seoDesc")} placeholder="SEO açıklaması" rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="status"
                checked={watchStatus}
                onCheckedChange={(checked: boolean) => setValue("status", checked)}
              />
              <Label htmlFor="status">Aktif</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Güncelle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Kategori Sil</DialogTitle>
            <DialogDescription>
              <strong>{deletingCategory?.name}</strong> kategorisini silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
