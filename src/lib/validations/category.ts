import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalı"),
  parentId: z.string().nullable().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  slug: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  sortOrder: z.number().int(),
  status: z.boolean(),
})

export type CategoryInput = z.infer<typeof categorySchema>
