import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalı"),
  slug: z.string().optional(),
  shortDesc: z.string().optional(),
  fullDesc: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  brandId: z.string().nullable().optional(),
  manufacturer: z.string().optional(),
  originCountry: z.string().optional(),
  priceUsd: z.coerce
    .number({ error: "Fiyat zorunlu" })
    .positive("Fiyat sıfırdan büyük olmalı"),
  priceTl: z.coerce.number().optional(),
  salePriceUsd: z.coerce.number().nullable().optional(),
  salePriceTl: z.coerce.number().nullable().optional(),
  saleStart: z.string().nullable().optional(),
  saleEnd: z.string().nullable().optional(),
  vatRate: z.coerce.number().int(),
  vatIncluded: z.boolean(),
  stockTracking: z.boolean(),
  stockQty: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  weight: z.coerce.number().nullable().optional(),
  width: z.coerce.number().nullable().optional(),
  height: z.coerce.number().nullable().optional(),
  depth: z.coerce.number().nullable().optional(),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  isBestSeller: z.boolean(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "PENDING", "HIDDEN"]),
  visibility: z.enum(["PUBLIC", "MEMBERS_ONLY", "PASSWORD_PROTECTED"]),
  publishAt: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
})

// Explicit type for form — z.coerce fields return correct types
export type ProductInput = {
  name: string
  slug?: string
  shortDesc?: string
  fullDesc?: string
  sku?: string
  barcode?: string
  brandId?: string | null
  manufacturer?: string
  originCountry?: string
  priceUsd: number
  priceTl?: number
  salePriceUsd?: number | null
  salePriceTl?: number | null
  saleStart?: string | null
  saleEnd?: string | null
  vatRate: number
  vatIncluded: boolean
  stockTracking: boolean
  stockQty: number
  lowStockThreshold: number
  weight?: number | null
  width?: number | null
  height?: number | null
  depth?: number | null
  isFeatured: boolean
  isNew: boolean
  isBestSeller: boolean
  seoTitle?: string
  seoDesc?: string
  status: "DRAFT" | "PUBLISHED" | "PENDING" | "HIDDEN"
  visibility: "PUBLIC" | "MEMBERS_ONLY" | "PASSWORD_PROTECTED"
  publishAt?: string | null
  sortOrder: number
  categoryIds?: string[]
  tagIds?: string[]
}
