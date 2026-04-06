"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Zap,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Image as ImageIcon,
  Download,
  Upload,
} from "lucide-react"

// ---------- Types ----------

interface ProductImage {
  id: string
  url: string
  altText: string | null
}

interface ProductCategory {
  category: { id: string; name: string; slug: string }
}

interface ProductBrand {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  shortDesc: string | null
  priceUsd: string | number
  priceTl: string | number
  salePriceUsd: string | number | null
  salePriceTl: string | number | null
  stockQty: number
  lowStockThreshold: number
  status: "DRAFT" | "PUBLISHED" | "PENDING" | "HIDDEN"
  isFeatured: boolean
  isNew: boolean
  isBestSeller: boolean
  createdAt: string
  brand: ProductBrand | null
  categories: ProductCategory[]
  images: ProductImage[]
  _count: { variations: number }
}

interface CategoryOption {
  id: string
  name: string
  slug: string
  children?: CategoryOption[]
}

interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  totalPages: number
}

// ---------- Helpers ----------

const statusMap: Record<string, { label: string; className: string }> = {
  PUBLISHED: {
    label: "Yayında",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  DRAFT: {
    label: "Taslak",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  PENDING: {
    label: "Beklemede",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  HIDDEN: {
    label: "Gizli",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
}

function formatPrice(value: string | number | null): string {
  if (value === null || value === undefined) return ""
  const num = typeof value === "string" ? parseFloat(value) : value
  return num.toFixed(2)
}

function flattenCategories(
  cats: CategoryOption[],
  depth = 0
): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = []
  for (const cat of cats) {
    result.push({ id: cat.id, name: cat.name, depth })
    if (cat.children) {
      result.push(...flattenCategories(cat.children, depth + 1))
    }
  }
  return result
}

// ---------- Component ----------

export default function UrunlerPage() {
  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryOption[]>([])

  // Filters
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [sort, setSort] = useState("newest")

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Quick add dialog
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddData, setQuickAddData] = useState({
    name: "",
    sku: "",
    autoSku: true,
    categoryId: "",
    priceUsd: "",
    priceTl: "",
    stockQty: "",
    shortDesc: "",
    status: "PUBLISHED" as "PUBLISHED" | "DRAFT",
  })
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false)
  const [quickAddError, setQuickAddError] = useState("")

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Bulk action
  const [bulkSubmitting, setBulkSubmitting] = useState(false)

  // Quick edit inline
  const [quickEditId, setQuickEditId] = useState<string | null>(null)
  const [quickEditData, setQuickEditData] = useState({ priceUsd: "", priceTl: "", stockQty: "", status: "DRAFT" as string })
  const [quickEditSubmitting, setQuickEditSubmitting] = useState(false)

  // CSV Import
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importError, setImportError] = useState("")
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch categories for filters
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(data))
      .catch(() => {})
  }, [])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort,
      })
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (filterCategory) params.set("categoryId", filterCategory)
      if (filterStatus) params.set("status", filterStatus)

      const res = await fetch(`/api/admin/products?${params}`)
      if (res.ok) {
        const data: ProductsResponse = await res.json()
        setProducts(data.products)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filterCategory, filterStatus, sort])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Reset selection on data change
  useEffect(() => {
    setSelectedIds(new Set())
  }, [products])

  // ---------- Handlers ----------

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)))
    }
  }

  const handleQuickAdd = async () => {
    setQuickAddSubmitting(true)
    setQuickAddError("")
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickAddData.name,
          sku: quickAddData.autoSku ? "" : quickAddData.sku,
          categoryId: quickAddData.categoryId || undefined,
          priceUsd: quickAddData.priceUsd,
          priceTl: quickAddData.priceTl,
          stockQty: quickAddData.stockQty,
          shortDesc: quickAddData.shortDesc,
          status: quickAddData.status,
        }),
      })
      if (res.ok) {
        setQuickAddOpen(false)
        setQuickAddData({
          name: "",
          sku: "",
          autoSku: true,
          categoryId: "",
          priceUsd: "",
          priceTl: "",
          stockQty: "",
          shortDesc: "",
          status: "PUBLISHED",
        })
        fetchProducts()
      } else {
        const err = await res.json()
        setQuickAddError(err.error || "Bir hata oluştu")
      }
    } catch {
      setQuickAddError("Bir hata oluştu")
    } finally {
      setQuickAddSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingProduct) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${deletingProduct.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setDeleteDialogOpen(false)
        setDeletingProduct(null)
        fetchProducts()
      }
    } catch {
      // silently fail
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`${selectedIds.size} ürünü silmek istediğinizden emin misiniz?`)) return
    setBulkSubmitting(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/products/${id}`, { method: "DELETE" })
        )
      )
      fetchProducts()
    } catch {
      // silently fail
    } finally {
      setBulkSubmitting(false)
    }
  }

  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.size === 0) return
    setBulkSubmitting(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/admin/products/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      )
      fetchProducts()
    } catch {
      // silently fail
    } finally {
      setBulkSubmitting(false)
    }
  }

  // ---------- Quick Edit Handlers ----------

  const openQuickEdit = (product: Product) => {
    setQuickEditId(product.id)
    setQuickEditData({
      priceUsd: String(Number(product.priceUsd).toFixed(2)),
      priceTl: String(Number(product.priceTl).toFixed(2)),
      stockQty: String(product.stockQty),
      status: product.status,
    })
  }

  const handleQuickEdit = async () => {
    if (!quickEditId) return
    setQuickEditSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${quickEditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceUsd: parseFloat(quickEditData.priceUsd),
          priceTl: parseFloat(quickEditData.priceTl),
          stockQty: parseInt(quickEditData.stockQty),
          status: quickEditData.status,
        }),
      })
      if (res.ok) {
        setQuickEditId(null)
        fetchProducts()
      }
    } catch { /* silently fail */ }
    finally { setQuickEditSubmitting(false) }
  }

  // ---------- CSV Export ----------

  const handleExport = async () => {
    const params = new URLSearchParams({ limit: "1000", sort, allImages: "true" })
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (filterCategory) params.set("categoryId", filterCategory)
    if (filterStatus) params.set("status", filterStatus)

    const res = await fetch(`/api/admin/products?${params}`)
    if (!res.ok) return
    const data = await res.json()

    const rows = data.products.map((p: Product) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      priceUsd: Number(p.priceUsd).toFixed(2),
      priceTl: Number(p.priceTl).toFixed(2),
      stockQty: p.stockQty,
      status: p.status,
      categories: p.categories.map((c: ProductCategory) => c.category.name).join("|"),
      image_urls: p.images.map((img: ProductImage) => img.url).join("|"),
    }))

    const headers = Object.keys(rows[0] || {})
    const csv = [headers.join(","), ...rows.map((r: Record<string, string | number>) => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `urunler-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---------- CSV Import ----------

  const handleImport = async () => {
    if (!importFile) return
    setImportSubmitting(true)
    setImportError("")
    setImportResult(null)
    try {
      const text = await importFile.text()
      const lines = text.split("\n").filter(l => l.trim())
      const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim())
      const rows = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.replace(/^"|"$/g, "").trim())
        return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]))
      })

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })
      const result = await res.json()
      if (res.ok) {
        setImportResult(result)
        fetchProducts()
      } else {
        setImportError(result.error || "Bir hata oluştu")
      }
    } catch {
      setImportError("Dosya okunamadı")
    }
    setImportSubmitting(false)
  }

  const flatCats = flattenCategories(categories)

  const selectClass =
    "flex h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

  // Pagination info
  const rangeStart = total === 0 ? 0 : (page - 1) * 20 + 1
  const rangeEnd = Math.min(page * 20, total)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ürünler</h1>
          <p className="text-sm text-muted-foreground">
            Toplam {total} ürün
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="size-4 mr-1.5" />
            İçe Aktar
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4 mr-1.5" />
            Dışa Aktar
          </Button>
          <Button variant="outline" onClick={() => setQuickAddOpen(true)}>
            <Zap className="size-4 mr-1.5" />
            Hızlı Ekle
          </Button>
          <Button render={<Link href="/admin/urunler/yeni" />}>
            <Plus className="size-4 mr-1.5" />
            Yeni Ürün
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Ürün adı veya SKU ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value)
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="">Tüm Kategoriler</option>
          {flatCats.map((c) => (
            <option key={c.id} value={c.id}>
              {"—".repeat(c.depth)} {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value)
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="">Tümü</option>
          <option value="PUBLISHED">Yayında</option>
          <option value="DRAFT">Taslak</option>
          <option value="PENDING">Beklemede</option>
          <option value="HIDDEN">Gizli</option>
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setPage(1)
          }}
          className={selectClass}
        >
          <option value="newest">En Yeni</option>
          <option value="oldest">En Eski</option>
          <option value="price_asc">Fiyat (Artan)</option>
          <option value="price_desc">Fiyat (Azalan)</option>
          <option value="name">Ada Göre</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedIds.size} ürün seçildi
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkSubmitting}
          >
            {bulkSubmitting && <Loader2 className="size-3.5 mr-1 animate-spin" />}
            Seçilenleri Sil
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" disabled={bulkSubmitting}>
                  Durumu Değiştir
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkStatusChange("PUBLISHED")}>
                Yayınla
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatusChange("DRAFT")}>
                Taslağa Al
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatusChange("HIDDEN")}>
                Gizle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Product Table (Desktop) */}
      <div className="hidden md:block rounded-lg border bg-white">
        {/* Table Header */}
        <div className="grid grid-cols-[40px_60px_1fr_140px_100px_80px_90px_60px] items-center gap-3 border-b px-4 py-2.5 bg-gray-50/50">
          <div>
            <Checkbox
              checked={products.length > 0 && selectedIds.size === products.length}
              onCheckedChange={toggleSelectAll}
            />
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Görsel
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Ürün
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Kategori
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Fiyat (USD)
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Stok
          </div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Durum
          </div>
          <div />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="size-10 mb-3" />
            <p className="text-sm">Ürün bulunamadı</p>
          </div>
        ) : (
          products.map((product) => {
            const st = statusMap[product.status] || statusMap.DRAFT
            const hasSale = product.salePriceUsd !== null
            const lowStock = product.stockQty <= product.lowStockThreshold
            const thumb = product.images[0]

            return (
              <div key={product.id}>
              <div
                className="grid grid-cols-[40px_60px_1fr_140px_100px_80px_90px_60px] items-center gap-3 border-b px-4 py-3 hover:bg-gray-50/50 transition-colors"
              >
                {/* Checkbox */}
                <div>
                  <Checkbox
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={() => toggleSelect(product.id)}
                  />
                </div>

                {/* Thumbnail */}
                <div className="size-10 rounded-md border bg-gray-100 flex items-center justify-center overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb.url}
                      alt={thumb.altText || product.name}
                      className="size-10 object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-5 text-gray-400" />
                  )}
                </div>

                {/* Name + SKU */}
                <div className="min-w-0">
                  <Link
                    href={`/admin/urunler/${product.id}`}
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {product.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {product.sku}
                  </span>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {product.categories.slice(0, 2).map((pc) => (
                    <Badge
                      key={pc.category.id}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {pc.category.name}
                    </Badge>
                  ))}
                  {product.categories.length > 2 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{product.categories.length - 2}
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <div className="text-sm">
                  {hasSale ? (
                    <div>
                      <span className="line-through text-muted-foreground text-xs">
                        ${formatPrice(product.priceUsd)}
                      </span>
                      <br />
                      <span className="text-emerald-600 font-medium">
                        ${formatPrice(product.salePriceUsd)}
                      </span>
                    </div>
                  ) : (
                    <span className="font-medium">
                      ${formatPrice(product.priceUsd)}
                    </span>
                  )}
                </div>

                {/* Stock */}
                <div>
                  <span
                    className={`text-sm font-medium ${
                      lowStock ? "text-red-600" : ""
                    }`}
                  >
                    {product.stockQty}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${st.className}`}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Actions */}
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openQuickEdit(product)}>
                        <Zap className="size-3.5 mr-1.5" />
                        Hızlı Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        render={<Link href={`/admin/urunler/${product.id}`} />}
                      >
                        <Pencil className="size-3.5 mr-1.5" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          setDeletingProduct(product)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="size-3.5 mr-1.5" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {quickEditId === product.id && (
                <div className="border-b bg-blue-50/50 px-4 py-3 grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end">
                  <div>
                    <Label className="text-xs">Fiyat (USD)</Label>
                    <Input type="number" step="0.01" value={quickEditData.priceUsd} onChange={e => setQuickEditData(d => ({ ...d, priceUsd: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Fiyat (TL)</Label>
                    <Input type="number" step="0.01" value={quickEditData.priceTl} onChange={e => setQuickEditData(d => ({ ...d, priceTl: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Stok</Label>
                    <Input type="number" value={quickEditData.stockQty} onChange={e => setQuickEditData(d => ({ ...d, stockQty: e.target.value }))} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Durum</Label>
                    <select value={quickEditData.status} onChange={e => setQuickEditData(d => ({ ...d, status: e.target.value }))} className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm">
                      <option value="PUBLISHED">Yayında</option>
                      <option value="DRAFT">Taslak</option>
                      <option value="PENDING">Beklemede</option>
                      <option value="HIDDEN">Gizli</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleQuickEdit} disabled={quickEditSubmitting}>{quickEditSubmitting ? "..." : "Kaydet"}</Button>
                    <Button size="sm" variant="outline" onClick={() => setQuickEditId(null)}>İptal</Button>
                  </div>
                </div>
              )}
              </div>
            )
          })
        )}
      </div>

      {/* Product Cards (Mobile) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="size-10 mb-3" />
            <p className="text-sm">Ürün bulunamadı</p>
          </div>
        ) : (
          products.map((product) => {
            const st = statusMap[product.status] || statusMap.DRAFT
            const hasSale = product.salePriceUsd !== null
            const lowStock = product.stockQty <= product.lowStockThreshold
            const thumb = product.images[0]

            return (
              <div
                key={product.id}
                className="rounded-lg border bg-white p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={() => toggleSelect(product.id)}
                  />
                  <div className="size-12 rounded-md border bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {thumb ? (
                      <img
                        src={thumb.url}
                        alt={thumb.altText || product.name}
                        className="size-12 object-cover"
                      />
                    ) : (
                      <ImageIcon className="size-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/urunler/${product.id}`}
                      className="text-sm font-medium hover:underline block truncate"
                    >
                      {product.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${st.className}`}
                  >
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pl-7">
                  <div>
                    {hasSale ? (
                      <>
                        <span className="line-through text-muted-foreground text-xs mr-1">
                          ${formatPrice(product.priceUsd)}
                        </span>
                        <span className="text-emerald-600 font-medium">
                          ${formatPrice(product.salePriceUsd)}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium">
                        ${formatPrice(product.priceUsd)}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className={lowStock ? "text-red-600 font-medium" : ""}>
                      Stok: {product.stockQty}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link href={`/admin/urunler/${product.id}`} />}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setDeletingProduct(product)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                {product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-7">
                    {product.categories.map((pc) => (
                      <Badge
                        key={pc.category.id}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {pc.category.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {rangeStart} - {rangeEnd} arası {total} üründen
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {generatePageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-1 text-sm text-muted-foreground"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* CSV Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>CSV&apos;den Ürün İçe Aktar</DialogTitle>
            <DialogDescription>
              CSV dosyası formatı: name, sku, priceUsd, priceTl, stockQty, shortDesc, status (PUBLISHED/DRAFT)
            </DialogDescription>
          </DialogHeader>
          {importError && <div className="text-sm text-destructive">{importError}</div>}
          {importResult && (
            <div className="text-sm">
              <p className="text-emerald-600">{importResult.created} ürün eklendi</p>
              {importResult.errors.length > 0 && (
                <div className="mt-2 text-destructive text-xs max-h-32 overflow-y-auto">
                  {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
            </div>
          )}
          <div className="space-y-3">
            <Label>CSV Dosyası</Label>
            <Input type="file" accept=".csv" onChange={e => setImportFile(e.target.files?.[0] || null)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>İptal</Button>
            <Button onClick={handleImport} disabled={!importFile || importSubmitting}>
              {importSubmitting ? "İçe Aktarılıyor..." : "İçe Aktar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hızlı Ürün Ekle</DialogTitle>
            <DialogDescription>
              Temel bilgilerle hızlıca yeni ürün ekleyin
            </DialogDescription>
          </DialogHeader>

          {quickAddError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {quickAddError}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="qa-name">Ürün Adı *</Label>
              <Input
                id="qa-name"
                placeholder="Ürün adı"
                value={quickAddData.name}
                onChange={(e) =>
                  setQuickAddData((d) => ({ ...d, name: e.target.value }))
                }
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="qa-sku">SKU</Label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={quickAddData.autoSku}
                    onCheckedChange={(checked: boolean) =>
                      setQuickAddData((d) => ({ ...d, autoSku: checked }))
                    }
                  />
                  Otomatik
                </label>
              </div>
              {!quickAddData.autoSku && (
                <Input
                  id="qa-sku"
                  placeholder="SKU kodu"
                  value={quickAddData.sku}
                  onChange={(e) =>
                    setQuickAddData((d) => ({ ...d, sku: e.target.value }))
                  }
                />
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="qa-category">Kategori</Label>
              <select
                id="qa-category"
                value={quickAddData.categoryId}
                onChange={(e) =>
                  setQuickAddData((d) => ({ ...d, categoryId: e.target.value }))
                }
                className={`w-full ${selectClass}`}
              >
                <option value="">Seçiniz</option>
                {flatCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {"—".repeat(c.depth)} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qa-priceUsd">Fiyat (USD) *</Label>
                <Input
                  id="qa-priceUsd"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={quickAddData.priceUsd}
                  onChange={(e) =>
                    setQuickAddData((d) => ({ ...d, priceUsd: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qa-priceTl">Fiyat (TL) *</Label>
                <Input
                  id="qa-priceTl"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={quickAddData.priceTl}
                  onChange={(e) =>
                    setQuickAddData((d) => ({ ...d, priceTl: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-1.5">
              <Label htmlFor="qa-stock">Stok Adedi</Label>
              <Input
                id="qa-stock"
                type="number"
                min="0"
                placeholder="0"
                value={quickAddData.stockQty}
                onChange={(e) =>
                  setQuickAddData((d) => ({ ...d, stockQty: e.target.value }))
                }
              />
            </div>

            {/* Short Description */}
            <div className="space-y-1.5">
              <Label htmlFor="qa-desc">Kısa Açıklama</Label>
              <Textarea
                id="qa-desc"
                rows={2}
                placeholder="Ürün kısa açıklaması"
                value={quickAddData.shortDesc}
                onChange={(e) =>
                  setQuickAddData((d) => ({ ...d, shortDesc: e.target.value }))
                }
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="qa-status"
                    checked={quickAddData.status === "PUBLISHED"}
                    onChange={() =>
                      setQuickAddData((d) => ({ ...d, status: "PUBLISHED" }))
                    }
                    className="accent-primary"
                  />
                  Yayınla
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="qa-status"
                    checked={quickAddData.status === "DRAFT"}
                    onChange={() =>
                      setQuickAddData((d) => ({ ...d, status: "DRAFT" }))
                    }
                    className="accent-primary"
                  />
                  Taslak
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuickAddOpen(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleQuickAdd}
              disabled={
                quickAddSubmitting || !quickAddData.name || !quickAddData.priceUsd || !quickAddData.priceTl
              }
            >
              {quickAddSubmitting && (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              )}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ürünü Sil</DialogTitle>
            <DialogDescription>
              <strong>{deletingProduct?.name}</strong> ürününü silmek
              istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
              disabled={deleteSubmitting}
            >
              {deleteSubmitting && (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              )}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- Pagination helper ----------

function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | "...")[] = [1]
  if (current > 3) pages.push("...")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("...")
  pages.push(total)
  return pages
}
