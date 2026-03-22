"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, LogIn, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { addToCart } from "@/lib/cart"

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
  productId,
  variationId,
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
    try {
      await addToCart(productId, variationId, quantity)
      toast.success("Ürün sepete eklendi!", {
        description: `${quantity} adet ürün sepetinize eklendi.`,
      })
      // Dispatch custom event so header can update cart count
      window.dispatchEvent(new CustomEvent("cart-updated"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sepete eklenemedi")
    } finally {
      setLoading(false)
    }
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
