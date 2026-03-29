"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Loader2,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

import { productSchema, type ProductInput } from "@/lib/validations/product"
import { generateSlug } from "@/lib/utils/slug"
import { VariationManager } from "@/components/admin/variation-manager"
import { ImageGalleryManager, type PendingImage } from "@/components/admin/image-gallery-manager"

// ---------- Types ----------

interface CategoryOption {
  id: string
  name: string
  slug: string
  children?: CategoryOption[]
}

interface ProductFormProps {
  productId?: string
  initialData?: {
    name: string
    slug: string
    shortDesc: string | null
    fullDesc: string | null
    sku: string
    barcode: string | null
    brandId: string | null
    manufacturer: string | null
    originCountry: string | null
    priceUsd: string | number
    priceTl: string | number
    salePriceUsd: string | number | null
    salePriceTl: string | number | null
    saleStart: string | null
    saleEnd: string | null
    vatRate: number
    vatIncluded: boolean
    stockTracking: boolean
    stockQty: number
    lowStockThreshold: number
    weight: string | number | null
    width: string | number | null
    height: string | number | null
    depth: string | number | null
    isFeatured: boolean
    isNew: boolean
    isBestSeller: boolean
    seoTitle: string | null
    seoDesc: string | null
    status: string
    visibility: string
    publishAt: string | null
    sortOrder: number
    categories: Array<{ category: { id: string; name: string } }>
    tags: Array<{ tag: { id: string; name: string } }>
  }
}

// ---------- Helpers ----------

function toNum(v: string | number | null | undefined): number | undefined {
  if (v === null || v === undefined || v === "") return undefined
  const n = typeof v === "string" ? parseFloat(v) : v
  return isNaN(n) ? undefined : n
}

function toDatetimeLocal(v: string | null | undefined): string {
  if (!v) return ""
  try {
    const d = new Date(v)
    return d.toISOString().slice(0, 16)
  } catch {
    return ""
  }
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

// ---------- Collapsible Section ----------

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}

// ---------- Select class ----------

const selectClass =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

// ---------- Main Component ----------

export function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!productId

  // Categories state
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(initialData?.categories?.map((c) => c.category.id) ?? [])
  )

  // Submitting state
  const [submitting, setSubmitting] = useState(false)

  // Pending images for create mode
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  // Pending variations for create mode
  const [pendingVariations, setPendingVariations] = useState<{
    hasVariations: boolean
    combinations: Array<{
      tempId: string
      combination: Record<string, string>
      sku: string
      priceDiff: number | null
      salePrice: number | null
      stock: number
      weight: number | null
      imageUrl: string
      description: string
      status: boolean
    }>
  } | null>(null)

  // Fetch categories
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(data))
      .catch(() => {})
  }, [])

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as Resolver<ProductInput>,
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      shortDesc: initialData?.shortDesc ?? "",
      fullDesc: initialData?.fullDesc ?? "",
      sku: initialData?.sku ?? "",
      barcode: initialData?.barcode ?? "",
      brandId: initialData?.brandId ?? "",
      manufacturer: initialData?.manufacturer ?? "",
      originCountry: initialData?.originCountry ?? "",
      priceUsd: toNum(initialData?.priceUsd),
      priceTl: toNum(initialData?.priceTl),
      salePriceUsd: toNum(initialData?.salePriceUsd) ?? null,
      salePriceTl: toNum(initialData?.salePriceTl) ?? null,
      saleStart: toDatetimeLocal(initialData?.saleStart) || null,
      saleEnd: toDatetimeLocal(initialData?.saleEnd) || null,
      vatRate: initialData?.vatRate ?? 18,
      vatIncluded: initialData?.vatIncluded ?? true,
      stockTracking: initialData?.stockTracking ?? true,
      stockQty: initialData?.stockQty ?? 0,
      lowStockThreshold: initialData?.lowStockThreshold ?? 5,
      weight: toNum(initialData?.weight) ?? null,
      width: toNum(initialData?.width) ?? null,
      height: toNum(initialData?.height) ?? null,
      depth: toNum(initialData?.depth) ?? null,
      isFeatured: initialData?.isFeatured ?? false,
      isNew: initialData?.isNew ?? false,
      isBestSeller: initialData?.isBestSeller ?? false,
      seoTitle: initialData?.seoTitle ?? "",
      seoDesc: initialData?.seoDesc ?? "",
      status: (initialData?.status as ProductInput["status"]) ?? "DRAFT",
      visibility: (initialData?.visibility as ProductInput["visibility"]) ?? "PUBLIC",
      publishAt: toDatetimeLocal(initialData?.publishAt) || null,
      sortOrder: initialData?.sortOrder ?? 0,
      categoryIds: initialData?.categories?.map((c) => c.category.id) ?? [],
      tagIds: initialData?.tags?.map((t) => t.tag.id) ?? [],
    },
  })

  // Watched values
  const watchName = watch("name")
  const watchShortDesc = watch("shortDesc")
  const watchSeoTitle = watch("seoTitle")
  const watchSeoDesc = watch("seoDesc")
  const watchStockTracking = watch("stockTracking")
  const watchVatIncluded = watch("vatIncluded")
  const watchStatus = watch("status")
  const watchSlug = watch("slug")
  const watchIsFeatured = watch("isFeatured")
  const watchIsNew = watch("isNew")
  const watchIsBestSeller = watch("isBestSeller")

  // Generate slug from name
  const handleGenerateSlug = useCallback(() => {
    if (watchName) {
      setValue("slug", generateSlug(watchName))
    }
  }, [watchName, setValue])

  // Toggle category
  const toggleCategory = useCallback(
    (catId: string) => {
      setSelectedCategoryIds((prev) => {
        const next = new Set(prev)
        if (next.has(catId)) next.delete(catId)
        else next.add(catId)
        const arr = Array.from(next)
        setValue("categoryIds", arr)
        return next
      })
    },
    [setValue]
  )

  // Submit
  const onSubmit = async (data: ProductInput) => {
    setSubmitting(true)
    try {
      const url = isEdit
        ? `/api/admin/products/${productId}`
        : "/api/admin/products"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          categoryIds: Array.from(selectedCategoryIds),
        }),
      })

      if (res.ok) {
        const product = await res.json()

        // In create mode, save pending images to the new product
        if (!isEdit && pendingImages.length > 0) {
          for (const img of pendingImages) {
            try {
              await fetch(`/api/admin/products/${product.id}/images`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: img.url,
                  altText: img.altText || null,
                  title: img.title || null,
                  description: img.description || null,
                  isFeatured: img.isFeatured,
                }),
              })
            } catch {
              // Continue with remaining images
            }
          }
        }

        // In create mode, save pending variations to the new product
        if (!isEdit && pendingVariations?.combinations.length) {
          try {
            await fetch(`/api/admin/products/${product.id}/variations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                variations: pendingVariations.combinations.map((row) => ({
                  combination: row.combination,
                  sku: row.sku || null,
                  priceDiff: row.priceDiff,
                  salePrice: row.salePrice,
                  stock: row.stock,
                  weight: row.weight,
                  imageUrl: row.imageUrl || null,
                  description: row.description || null,
                  status: row.status,
                })),
              }),
            })
          } catch {
            // Continue even if variations fail
          }
        }

        toast.success(isEdit ? "Ürün güncellendi" : "Ürün oluşturuldu")
        if (!isEdit) {
          router.push(`/admin/urunler/${product.id}`)
        }
      } else {
        const err = await res.json()
        toast.error(err.error || "Bir hata oluştu")
      }
    } catch {
      toast.error("Bir hata oluştu")
    } finally {
      setSubmitting(false)
    }
  }

  // Save as draft shortcut
  const handleSaveAsDraft = () => {
    setValue("status", "DRAFT")
    handleSubmit(onSubmit)()
  }

  // Publish shortcut
  const handlePublish = () => {
    setValue("status", "PUBLISHED")
    handleSubmit(onSubmit)()
  }

  const flatCats = flattenCategories(categories)

  // Number input register helper — always returns undefined for empty so z.coerce handles it
  const numReg = (name: keyof ProductInput) => ({
    ...register(name, {
      setValueAs: (v: string) => {
        if (v === "" || v == null) return undefined
        const n = parseFloat(v)
        return isNaN(n) ? undefined : n
      },
    }),
  })

  const intReg = (name: keyof ProductInput) => ({
    ...register(name, {
      setValueAs: (v: string) => {
        if (v === "" || v == null) return undefined
        const n = parseInt(v, 10)
        return isNaN(n) ? undefined : n
      },
    }),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ======================== LEFT COLUMN ======================== */}
        <div className="space-y-6">
          {/* Genel Bilgiler */}
          <Section title="Genel Bilgiler">
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Ürün Adı *</Label>
                <Input
                  id="name"
                  placeholder="Ürün adını girin"
                  className="text-base"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    placeholder="urun-adi"
                    {...register("slug")}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={handleGenerateSlug}
                  >
                    <RefreshCw className="size-3.5 mr-1" />
                    Oluştur
                  </Button>
                </div>
              </div>

              {/* Short Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shortDesc">Kısa Açıklama</Label>
                  <span className="text-xs text-muted-foreground">
                    {(watchShortDesc || "").length}/160
                  </span>
                </div>
                <Textarea
                  id="shortDesc"
                  placeholder="Ürünün kısa açıklaması"
                  rows={3}
                  maxLength={500}
                  {...register("shortDesc")}
                />
              </div>

              {/* Full Description */}
              <div className="space-y-1.5">
                <Label htmlFor="fullDesc">Detaylı Açıklama</Label>
                <Textarea
                  id="fullDesc"
                  placeholder="Ürünün detaylı açıklaması"
                  rows={8}
                  {...register("fullDesc")}
                />
              </div>
            </div>
          </Section>

          {/* Ürün Görselleri */}
          <ImageGalleryManager
            productId={productId}
            onPendingImagesChange={setPendingImages}
          />

          {/* Fiyatlandırma */}
          <Section title="Fiyatlandırma">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price USD */}
                <div className="space-y-1.5">
                  <Label htmlFor="priceUsd">Fiyat (USD) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      id="priceUsd"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-7"
                      {...numReg("priceUsd")}
                    />
                  </div>
                  {errors.priceUsd && (
                    <p className="text-xs text-destructive">{errors.priceUsd.message}</p>
                  )}
                </div>

                {/* Price TL */}
                <div className="space-y-1.5">
                  <Label htmlFor="priceTl">Fiyat (TL)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₺</span>
                    <Input
                      id="priceTl"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Otomatik hesaplanır"
                      className="pl-7"
                      {...numReg("priceTl")}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Boş bırakılırsa USD fiyatından hesaplanır
                  </p>
                </div>
              </div>

              {/* Sale Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="salePriceUsd">İndirimli Fiyat (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      id="salePriceUsd"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      className="pl-7"
                      {...numReg("salePriceUsd")}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salePriceTl">İndirimli Fiyat (TL)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₺</span>
                    <Input
                      id="salePriceTl"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      className="pl-7"
                      {...numReg("salePriceTl")}
                    />
                  </div>
                </div>
              </div>

              {/* Sale Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="saleStart">İndirim Başlangıcı</Label>
                  <Input
                    id="saleStart"
                    type="datetime-local"
                    {...register("saleStart")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="saleEnd">İndirim Bitişi</Label>
                  <Input
                    id="saleEnd"
                    type="datetime-local"
                    {...register("saleEnd")}
                  />
                </div>
              </div>

              {/* VAT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vatRate">KDV Oranı</Label>
                  <select id="vatRate" className={selectClass} {...intReg("vatRate")}>
                    <option value="0">%0</option>
                    <option value="1">%1</option>
                    <option value="8">%8</option>
                    <option value="18">%18</option>
                    <option value="20">%20</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>KDV Dahil</Label>
                  <div className="flex items-center gap-4 pt-1.5">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={watchVatIncluded === true}
                        onChange={() => setValue("vatIncluded", true)}
                        className="accent-primary"
                      />
                      Evet
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={watchVatIncluded === false}
                        onChange={() => setValue("vatIncluded", false)}
                        className="accent-primary"
                      />
                      Hayır
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Stok */}
          <Section title="Stok">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={watchStockTracking}
                  onCheckedChange={(checked: boolean) =>
                    setValue("stockTracking", checked)
                  }
                />
                <Label className="cursor-pointer" onClick={() => setValue("stockTracking", !watchStockTracking)}>
                  Stok takibi yap
                </Label>
              </div>

              {watchStockTracking && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="stockQty">Stok Adedi</Label>
                    <Input
                      id="stockQty"
                      type="number"
                      min="0"
                      {...intReg("stockQty")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lowStockThreshold">Düşük Stok Eşiği</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      min="0"
                      {...intReg("lowStockThreshold")}
                    />
                    <p className="text-xs text-muted-foreground">
                      Bu sayının altına düşünce uyarı verilir
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Varyasyonlar */}
          <VariationManager
            productId={productId}
            onChange={(hasVariations, combinations) =>
              setPendingVariations({ hasVariations, combinations })
            }
          />

          {/* Boyut ve Ağırlık */}
          <Section title="Boyut ve Ağırlık" defaultOpen={false}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="weight">Ağırlık (g)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="—"
                  {...numReg("weight")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="width">Genişlik (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="—"
                  {...numReg("width")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="height">Yükseklik (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="—"
                  {...numReg("height")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="depth">Derinlik (cm)</Label>
                <Input
                  id="depth"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="—"
                  {...numReg("depth")}
                />
              </div>
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO" defaultOpen={false}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seoTitle">SEO Başlık</Label>
                  <span className="text-xs text-muted-foreground">
                    {(watchSeoTitle || "").length}/60
                  </span>
                </div>
                <Input
                  id="seoTitle"
                  placeholder="Arama motoru başlığı"
                  maxLength={120}
                  {...register("seoTitle")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="seoDesc">SEO Açıklama</Label>
                  <span className="text-xs text-muted-foreground">
                    {(watchSeoDesc || "").length}/160
                  </span>
                </div>
                <Textarea
                  id="seoDesc"
                  placeholder="Arama motoru açıklaması"
                  rows={3}
                  maxLength={300}
                  {...register("seoDesc")}
                />
              </div>

              {/* Google Preview */}
              <div className="rounded-lg border bg-white p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="size-3" /> Google Önizleme
                </p>
                <p className="text-[#1a0dab] text-base leading-tight truncate">
                  {watchSeoTitle || watchName || "Sayfa Başlığı"}
                </p>
                <p className="text-[#006621] text-xs truncate">
                  siteniz.com/urunler/{watchSlug || "urun-adi"}
                </p>
                <p className="text-[#545454] text-xs line-clamp-2">
                  {watchSeoDesc || watchShortDesc || "Ürün açıklaması burada görünecek..."}
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* ======================== RIGHT COLUMN (Sidebar) ======================== */}
        <div className="space-y-6 lg:sticky lg:top-4">
          {/* Yayınlama */}
          <Card>
            <CardHeader>
              <CardTitle>Yayınlama</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status */}
                <div className="space-y-1.5">
                  <Label htmlFor="status">Durum</Label>
                  <select
                    id="status"
                    className={selectClass}
                    value={watchStatus}
                    onChange={(e) => setValue("status", e.target.value as ProductInput["status"])}
                  >
                    <option value="DRAFT">Taslak</option>
                    <option value="PUBLISHED">Yayında</option>
                    <option value="PENDING">Beklemede</option>
                    <option value="HIDDEN">Gizli</option>
                  </select>
                </div>

                {/* Visibility */}
                <div className="space-y-1.5">
                  <Label htmlFor="visibility">Görünürlük</Label>
                  <select
                    id="visibility"
                    className={selectClass}
                    {...register("visibility")}
                  >
                    <option value="PUBLIC">Herkese Açık</option>
                    <option value="MEMBERS_ONLY">Üyelere Özel</option>
                    <option value="PASSWORD_PROTECTED">Şifre Korumalı</option>
                  </select>
                </div>

                {/* Publish Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="publishAt">Yayın Tarihi</Label>
                  <Input
                    id="publishAt"
                    type="datetime-local"
                    {...register("publishAt")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Boş bırakılırsa hemen yayınlanır
                  </p>
                </div>

                {/* Sort Order */}
                <div className="space-y-1.5">
                  <Label htmlFor="sortOrder">Sıralama</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    {...intReg("sortOrder")}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveAsDraft}
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                    Taslak Olarak Kaydet
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePublish}
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {submitting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                    {isEdit ? "Güncelle ve Yayınla" : "Yayınla"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kategoriler */}
          <Card>
            <CardHeader>
              <CardTitle>Kategoriler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {flatCats.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Kategori bulunamadı</p>
                ) : (
                  flatCats.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                      style={{ paddingLeft: `${cat.depth * 16}px` }}
                    >
                      <Checkbox
                        checked={selectedCategoryIds.has(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      {cat.name}
                    </label>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Etiketler */}
          <Card>
            <CardHeader>
              <CardTitle>Etiketler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={watchIsFeatured}
                    onCheckedChange={(checked: boolean) =>
                      setValue("isFeatured", checked)
                    }
                  />
                  Öne Çıkan
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={watchIsNew}
                    onCheckedChange={(checked: boolean) =>
                      setValue("isNew", checked)
                    }
                  />
                  Yeni Ürün
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={watchIsBestSeller}
                    onCheckedChange={(checked: boolean) =>
                      setValue("isBestSeller", checked)
                    }
                  />
                  Çok Satan
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Ürün Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>Ürün Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="manufacturer">Üretici / Marka</Label>
                  <Input
                    id="manufacturer"
                    placeholder="Üretici adı"
                    {...register("manufacturer")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="Otomatik oluşturulur"
                    {...register("sku")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Boş bırakılırsa otomatik oluşturulur
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="barcode">Barkod</Label>
                  <Input
                    id="barcode"
                    placeholder="Barkod numarası"
                    {...register("barcode")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="originCountry">Menşei Ülke</Label>
                  <Input
                    id="originCountry"
                    placeholder="Ülke"
                    {...register("originCountry")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Videos, Files, Tabs — editing mode only */}
      {productId && (
        <>
          <ProductVideosSection productId={productId} />
          <ProductFilesSection productId={productId} />
          <ProductTabsSection productId={productId} />
          <RelatedProductsSection productId={productId} />
        </>
      )}
    </form>
  )
}

// ---------- ProductVideosSection ----------

interface ProductVideo {
  id: string
  url: string
  type: string
  title: string | null
  thumbnail: string | null
  sortOrder: number
}

function ProductVideosSection({ productId }: { productId: string }) {
  const [videos, setVideos] = useState<ProductVideo[]>([])
  const [newUrl, setNewUrl] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newType, setNewType] = useState("youtube")
  const [submitting, setSubmitting] = useState(false)

  const fetchVideos = () => {
    fetch(`/api/admin/products/${productId}/videos`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setVideos(data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchVideos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const handleAdd = async () => {
    if (!newUrl.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          type: newType,
          title: newTitle.trim() || null,
          sortOrder: videos.length,
        }),
      })
      if (res.ok) {
        setNewUrl("")
        setNewTitle("")
        setNewType("youtube")
        fetchVideos()
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (videoId: string) => {
    try {
      await fetch(
        `/api/admin/products/${productId}/videos?videoId=${videoId}`,
        { method: "DELETE" }
      )
      fetchVideos()
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ürün Videoları</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Existing videos */}
          {videos.length > 0 && (
            <ul className="space-y-2">
              {videos.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{v.title || v.url}</p>
                    <p className="truncate text-xs text-muted-foreground">{v.url}</p>
                    <span className="text-xs text-muted-foreground capitalize">{v.type}</span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(v.id)}
                  >
                    Sil
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* Add form */}
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Yeni Video Ekle</p>
            <div className="space-y-1.5">
              <Label>Video URL</Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Başlık (isteğe bağlı)</Label>
              <Input
                placeholder="Video başlığı"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tür</Label>
              <select
                className={selectClass}
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="other">Diğer</option>
              </select>
            </div>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={submitting || !newUrl.trim()}
              size="sm"
            >
              {submitting ? "Yükleniyor..." : "Ekle"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- ProductFilesSection ----------

interface ProductFile {
  id: string
  url: string
  fileName: string
  fileSize: number
  downloadable: boolean
  downloadCount: number
}

function ProductFilesSection({ productId }: { productId: string }) {
  const [files, setFiles] = useState<ProductFile[]>([])
  const [newUrl, setNewUrl] = useState("")
  const [newFileName, setNewFileName] = useState("")
  const [newFileSize, setNewFileSize] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchFiles = () => {
    fetch(`/api/admin/products/${productId}/files`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFiles(data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchFiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const handleAdd = async () => {
    if (!newUrl.trim() || !newFileName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          fileName: newFileName.trim(),
          fileSize: newFileSize ? parseInt(newFileSize, 10) : 0,
          downloadable: true,
        }),
      })
      if (res.ok) {
        setNewUrl("")
        setNewFileName("")
        setNewFileSize("")
        fetchFiles()
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await fetch(
        `/api/admin/products/${productId}/files?fileId=${fileId}`,
        { method: "DELETE" }
      )
      fetchFiles()
    } catch {
      // ignore
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>İndirilebilir Dosyalar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Existing files */}
          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{f.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(f.fileSize)} &middot; {f.downloadCount} indirme
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(f.id)}
                  >
                    Sil
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* Add form */}
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Yeni Dosya Ekle</p>
            <div className="space-y-1.5">
              <Label>Dosya URL</Label>
              <Input
                placeholder="https://cdn.example.com/dosya.pdf"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dosya Adı</Label>
              <Input
                placeholder="belge.pdf"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dosya Boyutu (byte)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={newFileSize}
                onChange={(e) => setNewFileSize(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={submitting || !newUrl.trim() || !newFileName.trim()}
              size="sm"
            >
              {submitting ? "Yükleniyor..." : "Ekle"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- ProductTabsSection ----------

interface ProductTab {
  id: string
  title: string
  content: string
  icon: string | null
  sortOrder: number
  status: boolean
}

function ProductTabsSection({ productId }: { productId: string }) {
  const [tabs, setTabs] = useState<ProductTab[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editingTab, setEditingTab] = useState<ProductTab | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchTabs = () => {
    fetch(`/api/admin/products/${productId}/tabs`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTabs(data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchTabs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const handleAdd = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/tabs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          sortOrder: tabs.length,
        }),
      })
      if (res.ok) {
        setNewTitle("")
        setNewContent("")
        fetchTabs()
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartEdit = (tab: ProductTab) => {
    setEditingTab(tab)
    setEditTitle(tab.title)
    setEditContent(tab.content)
  }

  const handleCancelEdit = () => {
    setEditingTab(null)
    setEditTitle("")
    setEditContent("")
  }

  const handleSaveEdit = async () => {
    if (!editingTab) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/tabs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tabId: editingTab.id,
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      })
      if (res.ok) {
        handleCancelEdit()
        fetchTabs()
      }
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (tabId: string) => {
    try {
      await fetch(
        `/api/admin/products/${productId}/tabs?tabId=${tabId}`,
        { method: "DELETE" }
      )
      if (editingTab?.id === tabId) handleCancelEdit()
      fetchTabs()
    } catch {
      // ignore
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Özel Sekmeler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Existing tabs */}
          {tabs.length > 0 && (
            <ul className="space-y-2">
              {tabs.map((tab) => (
                <li key={tab.id} className="rounded-lg border">
                  {editingTab?.id === tab.id ? (
                    /* Inline edit form */
                    <div className="space-y-3 p-3">
                      <div className="space-y-1.5">
                        <Label>Başlık</Label>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>İçerik</Label>
                        <Textarea
                          rows={5}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={saving || !editTitle.trim() || !editContent.trim()}
                        >
                          {saving ? "Yükleniyor..." : "Kaydet"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          İptal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display row */
                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{tab.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tab.content.slice(0, 80)}{tab.content.length > 80 ? "…" : ""}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(tab)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(tab.id)}
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Add new tab form */}
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Yeni Sekme Ekle</p>
            <div className="space-y-1.5">
              <Label>Başlık</Label>
              <Input
                placeholder="Sekme başlığı"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>İçerik</Label>
              <Textarea
                placeholder="Sekme içeriği"
                rows={5}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={submitting || !newTitle.trim() || !newContent.trim()}
              size="sm"
            >
              {submitting ? "Yükleniyor..." : "Ekle"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- RelatedProductsSection ----------

function RelatedProductsSection({ productId }: { productId: string }) {
  const [related, setRelated] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/products/${productId}/related`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setRelated(data))
      .catch(() => {})
  }, [productId])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(search)}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        // Filter out already-related and self
        const relatedIds = new Set(related.map((r: any) => r.relatedId))
        setSearchResults(data.products.filter((p: any) => p.id !== productId && !relatedIds.has(p.id)))
      }
      setSearching(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, related, productId])

  const addRelated = async (relatedId: string) => {
    setSubmitting(true)
    const res = await fetch(`/api/admin/products/${productId}/related`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relatedId }),
    })
    if (res.ok) {
      // Refresh
      const data = await fetch(`/api/admin/products/${productId}/related`).then(r => r.json())
      setRelated(data)
      setSearch("")
      setSearchResults([])
    }
    setSubmitting(false)
  }

  const removeRelated = async (relatedId: string) => {
    await fetch(`/api/admin/products/${productId}/related?relatedId=${relatedId}`, { method: "DELETE" })
    setRelated(prev => prev.filter((r: any) => r.relatedId !== relatedId))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">İlgili Ürünler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current related products */}
        {related.length > 0 && (
          <div className="space-y-2">
            {related.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  {r.related?.images?.[0]?.url && (
                    <img src={r.related.images[0].url} alt={r.related.name} className="size-8 rounded object-cover" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{r.related?.name}</p>
                    <p className="text-xs text-muted-foreground">{r.related?.sku}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removeRelated(r.relatedId)} className="text-destructive hover:text-destructive">
                  Kaldır
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Search to add */}
        <div className="relative">
          <Input
            placeholder="Ürün adı veya SKU ile ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {(searchResults.length > 0 || searching) && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 rounded-lg border bg-white shadow-lg">
              {searching && <div className="p-3 text-sm text-muted-foreground">Aranıyor...</div>}
              {searchResults.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => addRelated(p.id)}
                  className="flex w-full items-center gap-2 p-2.5 text-left hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {related.length === 0 && !search && (
          <p className="text-sm text-muted-foreground">Henüz ilgili ürün eklenmedi</p>
        )}
      </CardContent>
    </Card>
  )
}
