# Varyasyon Görselleri — Tasarım Dokümanı

**Tarih:** 2026-03-28
**Konu:** Ürün varyasyonlarına fotoğraf desteği eklenmesi
**Durum:** Onaylandı

---

## Özet

Ürün varyasyon sistemine iki katmanlı görsel desteği eklenir: varyasyon değeri bazlı (global ve ürün bazlı override) ve kombinasyon bazlı. Mağaza tarafında seçime göre ana görsel otomatik değişir, seçeneklerin yanında thumbnail görünür.

---

## 1. Veri Modeli

### Mevcut (değişmeyecek)
- `VariationValue.image` — global değer görseli (tüm ürünlerde geçerli)
- `ProductVariation.imageUrl` — kombinasyon görseli (mevcut, DB hazır)

### Yeni tablo (migration gerekir)
```prisma
model ProductVariationValueImage {
  id               String         @id @default(cuid())
  productId        String
  variationValueId String
  imageUrl         String

  product        Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  variationValue VariationValue @relation(fields: [variationValueId], references: [id], onDelete: Cascade)

  @@unique([productId, variationValueId])
  @@map("product_variation_value_images")
}
```

### Öncelik zinciri (yüksekten düşüğe)
1. `ProductVariation.imageUrl` — seçili kombinasyonun görseli
2. `ProductVariationValueImage.imageUrl` — bu üründe seçili değerin görseli
3. `VariationValue.image` — global değer görseli
4. Ürün ana galerisi (değişmez)

---

## 2. Admin — Bölüm A: Global Değer Görseli

**Dosya:** `src/app/admin/(dashboard)/ayarlar/varyasyonlar/page.tsx`

### Değişiklikler
- Her `VariationValue` satırına küçük kare görsel alanı eklenir (renk kodu inputunun yanına)
- Tıklayınca `ImagePickerModal` açılır:
  - Üst sekme: **Galeriden Seç** (genel yüklenen görseller listesi)
  - Alt sekme: **Dosya Yükle** (`/api/admin/upload` endpoint'i)
- Seçilen URL `VariationValue.image` alanına kaydedilir
- `PUT /api/admin/variations/[id]` payload'una `image` dahil edilir (zaten mevcut)

---

## 3. Admin — Bölüm B: Ürün Bazlı Değer Görseli

**Dosya:** `src/components/admin/variation-manager.tsx`

### Değişiklikler
- Seçili varyasyon değerleri listesinde her değerin yanına küçük kamera ikonu eklenir
- Tıklayınca `ImagePickerModal` açılır:
  - Üst sekme: **Galeriden Seç** (bu ürünün yüklü görselleri, `productId` ile filtrelenir)
  - Alt sekme: **Dosya Yükle**
- Seçilen görsel `ProductVariationValueImage` tablosuna kaydedilir
- **Yeni API endpoint:**
  - `POST /api/admin/products/[id]/variation-value-images` — kaydet/güncelle
  - `DELETE /api/admin/products/[id]/variation-value-images/[valueId]` — sil

---

## 4. Admin — Bölüm C: Kombinasyon Görseli

**Dosya:** `src/components/admin/variation-manager.tsx`

### Değişiklikler
- Kombinasyon tablosuna **"Görsel"** kolonu eklenir
- Her satırda:
  - Görsel yoksa: `+` ikonlu kare placeholder
  - Görsel varsa: thumbnail önizlemesi
  - Tıklayınca `ImagePickerModal` açılır
- Seçilen URL `CombinationRow.imageUrl` state'ine yazılır, kayıt sırasında `ProductVariation.imageUrl` olarak persist edilir

### Toplu atama
- Her kombinasyon satırında belirli bir varyasyon değerine göre "Bu değeri içeren tüm kombinasyonlara uygula" butonu
- Örn: "Kırmızı" değeri içeren tüm kombinasyonlara seçilen görseli tek seferde atar

---

## 5. Paylaşılan Bileşen: ImagePickerModal

**Dosya:** `src/components/admin/image-picker-modal.tsx` (yeni)

### Props
```typescript
interface ImagePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  productId?: string   // varsa ürün galerisi gösterilir, yoksa genel galeri
  title?: string
}
```

### Yapı
- İki sekme: "Galeriden Seç" | "Dosya Yükle"
- Galeriden Seç: grid görünümde mevcut görseller, tıklayınca seçilir
- Dosya Yükle: drag-drop veya tıkla, `/api/admin/upload` ile yükler, sonra otomatik seçilir

---

## 6. Mağaza — Varyasyon Seçici Görselleri

**Dosya:** `src/components/store/variation-selector.tsx`

### Display tipine göre
| Tip | Görsel gösterimi |
|-----|-----------------|
| `color_swatch` | Daire içinde thumbnail (yoksa düz renk) |
| `button` | Butonun üstünde küçük kare thumbnail (yoksa sadece metin) |
| `dropdown` | Seçim kutusunun yanında seçili değerin görseli |

### Veri akışı
- `VariationType.values` içine `image` alanı eklenir (zaten var)
- `ProductVariationValueImage` verileri ürün detay API'sinde `variationTypes` içinde birleştirilir (ürün bazlı override)

---

## 7. Mağaza — Ana Görsel Otomatik Değişimi

**Dosya:** `src/app/(store)/urun/[slug]/product-detail-client.tsx`

### Davranış
1. Kullanıcı varyasyon seçer → `onChange` callback tetiklenir
2. Öncelik zincirine göre görsel URL belirlenir
3. Ana görsel bileşeni (galeri) belirlenen URL'e geçiş yapar (fade animasyonu)
4. Galerinin alt thumbnail şeridi de bu görseli seçili gösterir
5. Seçim sıfırlanırsa ürünün orijinal ana görseline dönülür

### Öncelik hesabı (client-side)
```typescript
function resolveVariationImage(
  selectedCombination: ProductVariation | null,
  selectedValues: Record<string, string>,
  productValueImages: ProductVariationValueImage[],
  variationValues: VariationValue[]
): string | null {
  // 1. Kombinasyon görseli
  if (selectedCombination?.imageUrl) return selectedCombination.imageUrl

  // 2. Ürün bazlı değer görseli (ilk eşleşen)
  for (const [, valueId] of Object.entries(selectedValues)) {
    const override = productValueImages.find(p => p.variationValueId === valueId)
    if (override) return override.imageUrl
  }

  // 3. Global değer görseli (ilk eşleşen)
  for (const [, valueId] of Object.entries(selectedValues)) {
    const val = variationValues.find(v => v.id === valueId)
    if (val?.image) return val.image
  }

  return null
}
```

---

## 8. API Değişiklikleri

| Endpoint | Değişiklik |
|----------|------------|
| `GET /api/admin/variations` | Zaten `image` döndürüyor, değişmez |
| `PUT /api/admin/variations/[id]` | `values[].image` zaten işleniyor, değişmez |
| `GET /api/products/[slug]` | `variationTypes.values[].image` + `productVariationValueImages` eklenir |
| `POST /api/admin/products/[id]/variation-value-images` | **Yeni** |
| `DELETE /api/admin/products/[id]/variation-value-images/[valueId]` | **Yeni** |

---

## 9. Migration

```sql
CREATE TABLE product_variation_value_images (
  id                VARCHAR(191) NOT NULL,
  productId         VARCHAR(191) NOT NULL,
  variationValueId  VARCHAR(191) NOT NULL,
  imageUrl          TEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_value (productId, variationValueId),
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variationValueId) REFERENCES variation_values(id) ON DELETE CASCADE
);
```

---

## 10. Edge Case'ler

| Senaryo | Davranış |
|---------|----------|
| `VariationValue` silinirse | `ProductVariationValueImage` kayıtları CASCADE ile silinir |
| `Product` silinirse | `ProductVariationValueImage` kayıtları CASCADE ile silinir |
| `ProductVariation` silinirse | `imageUrl` zaten o satırın parçası, kayıt silinince gider |
| Görsel URL'i geçersizse | Öncelik zincirinde bir sonraki seçeneğe düşer |
| Kombinasyon henüz eşleşmemişse | Değer bazlı görsel veya global görsel gösterilir |

---

## 11. Etkilenen Dosyalar

| Dosya | İşlem |
|-------|-------|
| `prisma/schema.prisma` | `ProductVariationValueImage` modeli eklenir |
| `prisma/migrations/` | Yeni migration |
| `src/components/admin/image-picker-modal.tsx` | **Yeni bileşen** |
| `src/app/admin/(dashboard)/ayarlar/varyasyonlar/page.tsx` | Değer satırına görsel alanı |
| `src/components/admin/variation-manager.tsx` | Değer görseli + kombinasyon görseli kolonu + toplu atama |
| `src/app/api/admin/products/[id]/variation-value-images/route.ts` | **Yeni endpoint** |
| `src/app/api/products/[slug]/route.ts` | `productVariationValueImages` dahil edilir |
| `src/components/store/variation-selector.tsx` | Thumbnail gösterimi |
| `src/app/(store)/urun/[slug]/product-detail-client.tsx` | Ana görsel otomatik değişimi |
