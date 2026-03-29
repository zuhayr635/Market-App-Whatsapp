# Variation Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ürün varyasyonlarına fotoğraf desteği ekle — global değer görseli, ürün bazlı değer görseli ve kombinasyon görseli; mağazada seçime göre ana görsel otomatik değişsin.

**Architecture:** Yeni `ProductVariationValueImage` tablosu (productId + variationValueId → imageUrl) eklenir. Paylaşılan `ImagePickerModal` bileşeni tüm görsel seçim noktalarında kullanılır. Mağazada öncelik zinciri: kombinasyon → ürün-değer → global-değer → galeri.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma ORM, MySQL, shadcn/ui, Tailwind CSS

---

## Task 1: DB Schema + Migration

**Files:**
- Modify: `prisma/schema.prisma` (VariationValue ve ProductVariationValueImage modelleri)
- Create: `prisma/migrations/20260328010000_add_product_variation_value_images/migration.sql`

- [ ] **Step 1: schema.prisma'ya model ekle**

`prisma/schema.prisma` dosyasında `VariationValue` modelini bul (satır 402) ve `productVariationValueImages` ilişkisini ekle:

```prisma
model VariationValue {
  id              String  @id @default(cuid())
  variationTypeId String
  value           String
  colorCode       String?
  image           String?
  sortOrder       Int     @default(0)
  status          Boolean @default(true)

  variationType VariationType @relation(fields: [variationTypeId], references: [id], onDelete: Cascade)
  productVariationValueImages ProductVariationValueImage[]

  @@map("variation_values")
}
```

Ardından `ProductVariation` modelinin hemen altına (satır 432'den sonra) yeni modeli ekle:

```prisma
model ProductVariationValueImage {
  id               String @id @default(cuid())
  productId        String
  variationValueId String
  imageUrl         String @db.Text

  product        Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  variationValue VariationValue @relation(fields: [variationValueId], references: [id], onDelete: Cascade)

  @@unique([productId, variationValueId])
  @@map("product_variation_value_images")
}
```

- [ ] **Step 2: Product modelinde ilişki ekle**

`prisma/schema.prisma` içinde `Product` modelini bul ve şu satırı ekle (diğer ilişkilerin yanına):

```prisma
productVariationValueImages ProductVariationValueImage[]
```

- [ ] **Step 3: Migration SQL oluştur**

`prisma/migrations/20260328010000_add_product_variation_value_images/migration.sql` dosyasını oluştur:

```sql
CREATE TABLE `product_variation_value_images` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `variationValueId` VARCHAR(191) NOT NULL,
    `imageUrl` TEXT NOT NULL,

    UNIQUE INDEX `product_variation_value_images_productId_variationValueId_key`(`productId`, `variationValueId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `product_variation_value_images`
    ADD CONSTRAINT `product_variation_value_images_productId_fkey`
    FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `product_variation_value_images`
    ADD CONSTRAINT `product_variation_value_images_variationValueId_fkey`
    FOREIGN KEY (`variationValueId`) REFERENCES `variation_values`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 4: Prisma client üret**

```bash
cd C:/Users/Luana/Downloads/MultiCihanekspress/market-app
npx prisma generate
```

Beklenen: `✔ Generated Prisma Client`

- [ ] **Step 5: Migration uygula (local test için)**

```bash
npx prisma db push
```

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260328010000_add_product_variation_value_images/
git commit -m "feat: add ProductVariationValueImage schema and migration"
```

---

## Task 2: API — variation-value-images endpoints

**Files:**
- Create: `src/app/api/admin/products/[id]/variation-value-images/route.ts`

- [ ] **Step 1: Route dosyasını oluştur**

`src/app/api/admin/products/[id]/variation-value-images/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function requireAdmin(session: Awaited<ReturnType<typeof auth>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  return null
}

// GET: fetch all value images for a product
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const denied = await requireAdmin(session)
  if (denied) return denied

  const { id: productId } = await params
  const images = await db.productVariationValueImage.findMany({
    where: { productId },
  })
  return NextResponse.json(images)
}

// POST: upsert a value image for a product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const denied = await requireAdmin(session)
  if (denied) return denied

  const { id: productId } = await params
  const { variationValueId, imageUrl } = await req.json()

  if (!variationValueId || !imageUrl) {
    return NextResponse.json({ error: "variationValueId ve imageUrl zorunlu" }, { status: 400 })
  }

  const record = await db.productVariationValueImage.upsert({
    where: { productId_variationValueId: { productId, variationValueId } },
    create: { productId, variationValueId, imageUrl },
    update: { imageUrl },
  })
  return NextResponse.json(record)
}

// DELETE: remove a value image
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const denied = await requireAdmin(session)
  if (denied) return denied

  const { id: productId } = await params
  const { variationValueId } = await req.json()

  if (!variationValueId) {
    return NextResponse.json({ error: "variationValueId zorunlu" }, { status: 400 })
  }

  await db.productVariationValueImage.deleteMany({
    where: { productId, variationValueId },
  })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/products/
git commit -m "feat: add variation-value-images API endpoints"
```

---

## Task 3: API — slug route'u güncelle

**Files:**
- Modify: `src/app/api/products/[slug]/route.ts`

- [ ] **Step 1: productVariationValueImages include ekle**

`src/app/api/products/[slug]/route.ts` içinde `db.product.findUnique` sorgusuna şunu ekle (variations include'un hemen altına):

```typescript
productVariationValueImages: true,
```

- [ ] **Step 2: variationTypes sorgusunu güncelle**

Aynı dosyada `db.variationType.findMany` bloğu zaten `values` içeriyor. Değişiklik gerekmez — `image` alanı zaten seçiliyor.

- [ ] **Step 3: Return objesini güncelle**

`return NextResponse.json({ ...product, ... })` bloğuna `productVariationValueImages` zaten `...product` spread ile dahil olacak. Kontrol et, ekstra dönüşüm gerekmez.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/products/[slug]/route.ts
git commit -m "feat: include productVariationValueImages in product API response"
```

---

## Task 4: ImagePickerModal bileşeni (paylaşılan)

**Files:**
- Create: `src/components/admin/image-picker-modal.tsx`

Bu modal hem global varyasyon değeri, hem ürün-değer override, hem kombinasyon görsel seçimi için kullanılır.

- [ ] **Step 1: Bileşeni oluştur**

`src/components/admin/image-picker-modal.tsx`:

```typescript
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, ImageIcon, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GalleryImage {
  id: string
  url: string
  altText?: string | null
}

interface ImagePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  productId?: string
  title?: string
}

export function ImagePickerModal({
  open,
  onClose,
  onSelect,
  productId,
  title = "Görsel Seç",
}: ImagePickerModalProps) {
  const [tab, setTab] = useState<"gallery" | "upload">("gallery")
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchGallery = useCallback(async () => {
    try {
      const url = productId
        ? `/api/admin/products/${productId}/images`
        : `/api/admin/upload/gallery`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        // product images API returns array of {id,url,altText,...}
        // gallery endpoint returns same shape
        setGalleryImages(Array.isArray(data) ? data : [])
      }
    } catch {
      // silent
    }
  }, [productId])

  useEffect(() => {
    if (open) {
      setSelectedUrl(null)
      fetchGallery()
    }
  }, [open, fetchGallery])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Yükleme hatası")
        return
      }
      const data = await res.json()
      onSelect(data.url)
      onClose()
    } catch {
      toast.error("Yükleme başarısız")
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b mb-3">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "gallery"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("gallery")}
          >
            Galeriden Seç
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("upload")}
          >
            Dosya Yükle
          </button>
        </div>

        {tab === "gallery" ? (
          <>
            {galleryImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <ImageIcon className="size-8 mb-2" />
                <p className="text-sm">Henüz görsel yok</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto">
                {galleryImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedUrl(img.url)}
                    className={`relative aspect-square rounded-md border-2 overflow-hidden transition-all ${
                      selectedUrl === img.url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.altText || ""}
                      className="w-full h-full object-cover"
                    />
                    {selectedUrl === img.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="size-5 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="size-3.5 mr-1" /> İptal
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={!selectedUrl}>
                Seç
              </Button>
            </div>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ""
              }}
            />
            <Upload className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Tıklayın veya sürükleyin</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, GIF - Maks. 5MB</p>
            {uploading && <p className="text-xs text-primary mt-2">Yükleniyor...</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/image-picker-modal.tsx
git commit -m "feat: add ImagePickerModal shared component"
```

---

## Task 5: Admin — varyasyonlar sayfası (global değer görseli)

**Files:**
- Modify: `src/app/admin/(dashboard)/ayarlar/varyasyonlar/page.tsx`

- [ ] **Step 1: Import ekle**

Dosyanın en üstüne import'ları ekle:

```typescript
import { ImagePickerModal } from "@/components/admin/image-picker-modal"
import { Camera } from "lucide-react"
```

- [ ] **Step 2: State ekle**

`VaryasyonlarPage` fonksiyonu içinde state'leri ekle:

```typescript
const [imagePickerOpen, setImagePickerOpen] = useState(false)
const [imagePickerIndex, setImagePickerIndex] = useState<number | null>(null)
```

- [ ] **Step 3: Her değer satırına görsel butonu ekle**

Form'daki `formValues.map(...)` bölümünü bul. Her değer satırında renk kodu inputunun yanına şunu ekle:

```typescript
{/* Görsel butonu */}
<div className="space-y-1">
  <Label className="text-xs">Görsel</Label>
  <button
    type="button"
    onClick={() => {
      setImagePickerIndex(index)
      setImagePickerOpen(true)
    }}
    className="relative size-8 rounded border bg-gray-50 hover:bg-gray-100 flex items-center justify-center overflow-hidden"
  >
    {v.image ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={v.image} alt="" className="w-full h-full object-cover" />
    ) : (
      <Camera className="size-4 text-muted-foreground" />
    )}
  </button>
</div>
```

- [ ] **Step 4: Modal'ı render et**

Bileşenin return JSX'inin en sonuna (Dialog'ların yanına) ekle:

```typescript
<ImagePickerModal
  open={imagePickerOpen}
  onClose={() => setImagePickerOpen(false)}
  onSelect={(url) => {
    if (imagePickerIndex !== null) {
      handleUpdateValue(imagePickerIndex, "image", url)
    }
    setImagePickerIndex(null)
  }}
  title="Değer Görseli Seç"
/>
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/(dashboard)/ayarlar/varyasyonlar/page.tsx
git commit -m "feat: add global variation value image picker in admin settings"
```

---

## Task 6: Admin — variation-manager (kombinasyon görseli + ürün-değer görseli)

**Files:**
- Modify: `src/components/admin/variation-manager.tsx`

### 6A: Import ve State

- [ ] **Step 1: Import ekle**

```typescript
import { ImagePickerModal } from "@/components/admin/image-picker-modal"
import { Camera } from "lucide-react"
```

- [ ] **Step 2: State ekle**

`VariationManager` fonksiyonu içine:

```typescript
// Image picker state
const [imagePickerOpen, setImagePickerOpen] = useState(false)
const [imagePickerTarget, setImagePickerTarget] = useState<
  | { type: "combination"; tempId: string }
  | { type: "productValue"; valueId: string }
  | null
>(null)

// Product variation value images (ürün bazlı değer görselleri)
const [productValueImages, setProductValueImages] = useState<
  Record<string, string>  // variationValueId -> imageUrl
>({})
```

- [ ] **Step 3: Mevcut değer görsellerini yükle**

`fetchProductVariations` fonksiyonunun hemen altına yeni bir fetch ekle:

```typescript
const fetchProductValueImages = useCallback(async () => {
  if (!productId) return
  try {
    const res = await fetch(`/api/admin/products/${productId}/variation-value-images`)
    if (res.ok) {
      const data: Array<{ variationValueId: string; imageUrl: string }> = await res.json()
      const map: Record<string, string> = {}
      for (const item of data) {
        map[item.variationValueId] = item.imageUrl
      }
      setProductValueImages(map)
    }
  } catch {
    // silent
  }
}, [productId])
```

`useEffect` içinde `fetchProductVariations()` çağrısının yanına `fetchProductValueImages()` ekle.

### 6B: Değer chiplerinde kamera ikonu

- [ ] **Step 4: Seçili değer chip'lerine kamera butonu ekle**

Satır ~678'deki chip button'unu bul. `{v.value}` textinin hemen ardına, sadece chip seçili VE `v.id` varsa kamera ikonunu ekle:

```typescript
{isSelected && v.id && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation()
      setImagePickerTarget({ type: "productValue", valueId: v.id! })
      setImagePickerOpen(true)
    }}
    className="ml-1 rounded"
    title="Bu değer için ürün görseli ata"
  >
    {productValueImages[v.id!] ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={productValueImages[v.id!]}
        alt=""
        className="size-4 rounded object-cover"
      />
    ) : (
      <Camera className="size-3 opacity-60" />
    )}
  </button>
)}
```

### 6C: Kombinasyon tablosuna Görsel kolonu

- [ ] **Step 5: Tablo header'ına kolon ekle**

`<th>Kombinasyon</th>` satırından önce:

```typescript
<th className="text-center px-3 py-2 font-medium text-muted-foreground w-12">
  Görsel
</th>
```

- [ ] **Step 6: Her satıra görsel hücresi ekle**

`<td className="px-3 py-2">` (kombinasyon label td'si) satırından önce:

```typescript
<td className="px-3 py-2 text-center">
  <button
    type="button"
    onClick={() => {
      setImagePickerTarget({ type: "combination", tempId: row.tempId })
      setImagePickerOpen(true)
    }}
    className="relative size-8 rounded border bg-gray-50 hover:bg-gray-100 flex items-center justify-center overflow-hidden mx-auto"
  >
    {row.imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={row.imageUrl} alt="" className="w-full h-full object-cover" />
    ) : (
      <Camera className="size-3.5 text-muted-foreground" />
    )}
  </button>
</td>
```

### 6D: Toplu görsel atama

- [ ] **Step 7: Bulk assign fonksiyonu ekle**

Mevcut `handleBulkSetPriceDiff` fonksiyonunun altına:

```typescript
const handleBulkAssignImage = (valueId: string, imageUrl: string) => {
  // Find which type+value this valueId belongs to
  let valueName: string | null = null
  let typeName: string | null = null
  for (const st of selectedTypes) {
    const val = st.values.find((v) => v.id === valueId)
    if (val) {
      valueName = val.value
      typeName = st.name
      break
    }
  }
  if (!valueName || !typeName) return

  setCombinations((prev) =>
    prev.map((row) =>
      row.combination[typeName!] === valueName ? { ...row, imageUrl } : row
    )
  )
  toast.success(`"${valueName}" içeren tüm kombinasyonlara görsel atandı`)
}
```

### 6E: onSelect handler + Modal

- [ ] **Step 8: Image picker onSelect handler**

```typescript
const handleImagePickerSelect = useCallback(
  async (url: string) => {
    if (!imagePickerTarget) return

    if (imagePickerTarget.type === "combination") {
      handleUpdateCombination(imagePickerTarget.tempId, "imageUrl", url)
    } else {
      // product value image
      const valueId = imagePickerTarget.valueId
      setProductValueImages((prev) => ({ ...prev, [valueId]: url }))

      // persist if productId exists
      if (productId) {
        try {
          await fetch(`/api/admin/products/${productId}/variation-value-images`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variationValueId: valueId, imageUrl: url }),
          })
          // Also bulk-assign to matching combinations
          handleBulkAssignImage(valueId, url)
        } catch {
          toast.error("Görsel kaydedilemedi")
        }
      } else {
        handleBulkAssignImage(valueId, url)
      }
    }
    setImagePickerTarget(null)
  },
  [imagePickerTarget, productId, handleBulkAssignImage, handleUpdateCombination]
)
```

- [ ] **Step 9: Modal'ı JSX'e ekle**

Bileşenin `return` içindeki Card kapanışından önce:

```typescript
<ImagePickerModal
  open={imagePickerOpen}
  onClose={() => {
    setImagePickerOpen(false)
    setImagePickerTarget(null)
  }}
  onSelect={handleImagePickerSelect}
  productId={productId}
  title={
    imagePickerTarget?.type === "combination"
      ? "Kombinasyon Görseli Seç"
      : "Değer Görseli Seç (Bu Ürün)"
  }
/>
```

- [ ] **Step 10: Commit**

```bash
git add src/components/admin/variation-manager.tsx
git commit -m "feat: add combination image column and product-value image picker in variation manager"
```

---

## Task 7: Store — variation-selector thumbnail'leri

**Files:**
- Modify: `src/components/store/variation-selector.tsx`

`VariationValue` interface'inde `image` alanı zaten var. Sadece render tarafını güncelle.

- [ ] **Step 1: `productValueImages` prop ekle**

Interface ve props'a ekle:

```typescript
interface VariationSelectorProps {
  variationTypes: VariationType[]
  variations: ProductVariation[]
  onChange: (selected: Record<string, string>, variation: ProductVariation | null) => void
  productValueImages?: Record<string, string>  // variationValueId -> imageUrl
}
```

`export function VariationSelector(...)` imzasına `productValueImages = {}` ekle.

- [ ] **Step 2: color_swatch render'ını güncelle**

Mevcut color_swatch button içinde `<span style={{ backgroundColor: valObj?.colorCode }}` bloğunu bul ve şununla değiştir:

```typescript
{valObj?.image || productValueImages[valObj?.id ?? ""] ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={productValueImages[valObj?.id ?? ""] || valObj?.image || ""}
    alt={valueName}
    className="absolute inset-[3px] rounded-full object-cover"
  />
) : (
  <span
    className="absolute inset-[3px] rounded-full shadow-inner"
    style={{ backgroundColor: valObj?.colorCode || "#ccc" }}
  />
)}
```

- [ ] **Step 3: button render'ını güncelle**

Button tipindeki button'u bul. `{valueName}` textini şunla değiştir:

```typescript
{(() => {
  const valObj = valueMap.get(valueName)
  const imgSrc = productValueImages[valObj?.id ?? ""] || valObj?.image
  return (
    <>
      {imgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc} alt={valueName} className="size-5 rounded object-cover" />
      )}
      {valueName}
    </>
  )
})()}
```

Not: button tipinin `valueMap` kullanabilmesi için `valueMap` tanımlamasını dışarı taşı (zaten `activeTypes.map` içinde tanımlı — içinde kal).

- [ ] **Step 4: dropdown için seçili görsel göster**

Select bloğunun hemen altına, select'ten sonra ekle:

```typescript
{selected[vType.name] && (() => {
  const selValObj = valueMap.get(selected[vType.name])
  const imgSrc = productValueImages[selValObj?.id ?? ""] || selValObj?.image
  return imgSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={selected[vType.name]}
      className="mt-1.5 size-8 rounded border object-cover"
    />
  ) : null
})()}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/store/variation-selector.tsx
git commit -m "feat: add thumbnail images to variation selector (swatch/button/dropdown)"
```

---

## Task 8: Store — product-detail-client öncelik zinciri

**Files:**
- Modify: `src/app/(store)/urun/[slug]/product-detail-client.tsx`

- [ ] **Step 1: Interface'lere ekle**

`SerializedProduct` interface'ine ekle:

```typescript
productVariationValueImages?: Array<{ variationValueId: string; imageUrl: string }>
```

- [ ] **Step 2: productValueImages map oluştur**

`ProductDetailClient` bileşeni içinde, mevcut state'lerin yanına:

```typescript
const productValueImagesMap = useMemo(() => {
  const map: Record<string, string> = {}
  for (const item of product.productVariationValueImages ?? []) {
    map[item.variationValueId] = item.imageUrl
  }
  return map
}, [product.productVariationValueImages])
```

- [ ] **Step 3: resolveVariationImage helper yaz**

`handleVariationChange` fonksiyonunun üstüne:

```typescript
const resolveVariationImage = useCallback(
  (
    variation: ProductVariation | null,
    sel: Record<string, string>
  ): string | null => {
    // 1. Kombinasyon görseli
    if (variation?.imageUrl) return variation.imageUrl

    // 2. Ürün bazlı değer görseli
    for (const typeName of Object.keys(sel)) {
      const vType = variationTypes.find((t) => t.name === typeName)
      const valObj = vType?.values.find((v) => v.value === sel[typeName])
      if (valObj && productValueImagesMap[valObj.id]) {
        return productValueImagesMap[valObj.id]
      }
    }

    // 3. Global değer görseli
    for (const typeName of Object.keys(sel)) {
      const vType = variationTypes.find((t) => t.name === typeName)
      const valObj = vType?.values.find((v) => v.value === sel[typeName])
      if (valObj?.image) return valObj.image
    }

    return null
  },
  [variationTypes, productValueImagesMap]
)
```

- [ ] **Step 4: handleVariationChange güncelle**

Mevcut:
```typescript
const handleVariationChange = (
  _selected: Record<string, string>,
  variation: ProductVariation | null
) => {
  setSelectedVariation(variation)
  setQuantity(1)
```

Değiştir:
```typescript
const handleVariationChange = (
  sel: Record<string, string>,
  variation: ProductVariation | null
) => {
  setSelectedVariation(variation)
  setQuantity(1)
  setResolvedVariationImage(resolveVariationImage(variation, sel))
```

- [ ] **Step 5: resolvedVariationImage state ekle**

```typescript
const [resolvedVariationImage, setResolvedVariationImage] = useState<string | null>(null)
```

- [ ] **Step 6: activeVariationImage'i güncelle**

Mevcut:
```typescript
const activeVariationImage = selectedVariation?.imageUrl || null
```

Değiştir:
```typescript
const activeVariationImage = resolvedVariationImage
```

- [ ] **Step 7: VariationSelector'a productValueImages prop geç**

```typescript
<VariationSelector
  variationTypes={variationTypes}
  variations={product.variations}
  onChange={handleVariationChange}
  productValueImages={productValueImagesMap}
/>
```

- [ ] **Step 8: Commit**

```bash
git add src/app/(store)/urun/[slug]/product-detail-client.tsx
git commit -m "feat: resolve variation image with priority chain in product detail"
```

---

## Task 9: Deploy hazırlığı

- [ ] **Step 1: TypeScript build kontrol**

```bash
cd C:/Users/Luana/Downloads/MultiCihanekspress/market-app
npm run build
```

Beklenen: Build başarıyla tamamlanır, hata yok.

- [ ] **Step 2: Hata varsa düzelt, yoksa Docker build**

```bash
docker build -t market-app .
```

- [ ] **Step 3: Son commit**

```bash
git add -A
git status
# Beklenmeyen dosya yoksa:
git commit -m "feat: variation images — deploy ready"
```
