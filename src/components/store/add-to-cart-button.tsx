"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, LogIn, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface AddToCartButtonProps {
  isLoggedIn: boolean
  outOfStock: boolean
  productId: string
  variationId?: string | null
  quantity: number
}

export function AddToCartButton({
  isLoggedIn,
  outOfStock,
  quantity,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false)

  if (!isLoggedIn) {
    return (
      <Link
        href="/giris"
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
      >
        <LogIn className="h-4 w-4" />
        Sepete eklemek icin giris yapin
      </Link>
    )
  }

  const handleAddToCart = async () => {
    setLoading(true)
    // Cart API will be implemented in Faz 3
    // Simulate a brief delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500))
    toast.success("Ürün sepete eklendi!", {
      description: `${quantity} adet ürün sepetinize eklendi.`,
    })
    setLoading(false)
  }

  return (
    <Button
      size="lg"
      className="w-full gap-2"
      disabled={outOfStock || loading}
      onClick={handleAddToCart}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      {outOfStock ? "Tükendi" : loading ? "Ekleniyor..." : "Sepete Ekle"}
    </Button>
  )
}
