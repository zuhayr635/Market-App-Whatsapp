"use client"

import { useCallback, useEffect, useState } from "react"
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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch {
      // silently fail
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

  const openCreateDialog = () => {
    setEditingCategory(null)
    setErrorMessage("")
    reset({
      name: "",
      parentId: null,
      description: "",
      image: "",
      slug: "",
      seoTitle: "",
      seoDesc: "",
      sortOrder: 0,
      status: true,
    })
    setDialogOpen(true)
  }

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

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories"
      const method = editingCategory ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
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
      const res = await fetch(`/api/admin/categories/${deletingCategory.id}`, {
        method: "DELETE",
      })
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

  // Flatten categories for parent select options
  const flatCategories: { id: string; name: string; depth: number }[] = []
  const flattenCategories = (
    cats: CategoryWithChildren[],
    depth: number = 0
  ) => {
    for (const cat of cats) {
      flatCategories.push({ id: cat.id, name: cat.name, depth })
      if (cat.children) flattenCategories(cat.children, depth + 1)
    }
  }
  flattenCategories(categories)

  // Filter categories by search
  const filterCategories = (
    cats: CategoryWithChildren[],
    query: string
  ): CategoryWithChildren[] => {
    if (!query) return cats
    const lower = query.toLowerCase()
    return cats.reduce<CategoryWithChildren[]>((acc, cat) => {
      const childMatches = filterCategories(cat.children || [], query)
      if (
        cat.name.toLowerCase().includes(lower) ||
        cat.slug.toLowerCase().includes(lower) ||
        childMatches.length > 0
      ) {
        acc.push({ ...cat, children: childMatches })
      }
      return acc
    }, [])
  }

  const filteredCategories = filterCategories(categories, searchQuery)

  const renderCategoryRow = (
    category: CategoryWithChildren,
    depth: number = 0
  ) => {
    return (
      <div key={category.id}>
        <div
          className="flex items-center gap-3 border-b px-4 py-3 hover:bg-gray-50 transition-colors"
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          {depth > 0 && (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {category.name}
              </span>
              <Badge
                variant={category.status ? "default" : "secondary"}
                className="text-[10px]"
              >
                {category.status ? "Aktif" : "Pasif"}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{category.slug}</span>
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {category._count.products} ürün
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEditDialog(category)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openDeleteDialog(category)}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        </div>
        {category.children?.map((child) => renderCategoryRow(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategoriler</h1>
          <p className="text-sm text-muted-foreground">
            Ürün kategorilerini yönetin
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Kategori ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category List */}
      <div className="rounded-lg border bg-white">
        {/* Table header */}
        <div className="flex items-center gap-3 border-b px-4 py-2.5 bg-gray-50/50">
          <div className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Kategori
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Ürünler
          </div>
          <div className="w-16" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderTree className="size-10 mb-3" />
            <p className="text-sm">
              {searchQuery
                ? "Aramanızla eşleşen kategori bulunamadı"
                : "Henüz kategori eklenmemiş"}
            </p>
          </div>
        ) : (
          filteredCategories.map((cat) => renderCategoryRow(cat))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Kategori Düzenle" : "Yeni Kategori"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Kategori bilgilerini güncelleyin"
                : "Yeni bir kategori oluşturun"}
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Kategori Adı *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Kategori adı"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Parent Category */}
            <div className="space-y-1.5">
              <Label htmlFor="parentId">Üst Kategori</Label>
              <select
                id="parentId"
                {...register("parentId")}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  {...register("slug")}
                  placeholder="otomatik-olusturulur"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (watchName) {
                      setValue("slug", generateSlug(watchName))
                    }
                  }}
                >
                  Oluştur
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Kategori açıklaması"
                rows={3}
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <Label htmlFor="sortOrder">Sıralama</Label>
              <Input
                id="sortOrder"
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            {/* SEO Title */}
            <div className="space-y-1.5">
              <Label htmlFor="seoTitle">SEO Başlık</Label>
              <Input
                id="seoTitle"
                {...register("seoTitle")}
                placeholder="SEO başlığı"
              />
            </div>

            {/* SEO Description */}
            <div className="space-y-1.5">
              <Label htmlFor="seoDesc">SEO Açıklama</Label>
              <Textarea
                id="seoDesc"
                {...register("seoDesc")}
                placeholder="SEO açıklaması"
                rows={2}
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="status"
                checked={watchStatus}
                onCheckedChange={(checked: boolean) =>
                  setValue("status", checked)
                }
              />
              <Label htmlFor="status">Aktif</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                {editingCategory ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Kategori Sil</DialogTitle>
            <DialogDescription>
              <strong>{deletingCategory?.name}</strong> kategorisini silmek
              istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

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
