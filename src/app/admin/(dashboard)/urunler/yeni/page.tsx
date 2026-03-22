"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/components/admin/product-form"

export default function YeniUrunPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/admin/urunler" />}>
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yeni Ürün</h1>
          <p className="text-sm text-muted-foreground">
            Yeni bir ürün ekleyin
          </p>
        </div>
      </div>

      <ProductForm />
    </div>
  )
}
