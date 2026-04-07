"use client"

import { ProductCard, type ProductCardData } from "@/components/store/product-card"

interface HomeProductGridProps {
  products: ProductCardData[]
}

export function HomeProductGrid({ products }: HomeProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
