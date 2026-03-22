"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { ShoppingCart, Trash2, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { type CartData, fetchCart, removeCartItem, formatPrice } from "@/lib/cart"

export function MiniCart() {
  const { data: session } = useSession()
  const [cart, setCart] = useState<CartData | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadCart = useCallback(async () => {
    if (!session?.user) return
    setLoading(true)
    try {
      const data = await fetchCart()
      setCart(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  // Listen for cart updates
  useEffect(() => {
    const handler = () => loadCart()
    window.addEventListener("cart-updated", handler)
    return () => window.removeEventListener("cart-updated", handler)
  }, [loadCart])

  const handleRemove = async (itemId: string) => {
    try {
      await removeCartItem(itemId)
      await loadCart()
      window.dispatchEvent(new CustomEvent("cart-updated"))
    } catch {
      toast.error("Silme başarısız")
    }
  }

  const itemCount = cart?.items.length ?? 0

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className="relative inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground" />
        }
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="sr-only">Sepet</span>
        {itemCount > 0 && (
          <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-[10px]">
            {itemCount}
          </Badge>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="flex w-80 flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Sepetim ({itemCount})</SheetTitle>
        </SheetHeader>

        {loading && !cart ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sepetiniz boş</p>
            <SheetClose
              render={<Link href="/urunler" />}
            >
              <Button size="sm" onClick={() => setOpen(false)}>Alışverişe Başla</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3 p-1">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-md border p-2">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
                      {item.product.image ? (
                        <Image
                          src={item.variation?.imageUrl || item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <p className="line-clamp-1 text-xs font-medium">{item.product.name}</p>
                      {item.variation && (
                        <p className="text-[10px] text-muted-foreground">
                          {Object.values(item.variation.combination).join(", ")}
                        </p>
                      )}
                      <p className="text-xs">
                        {item.quantity} x {formatPrice(item.unitPriceUsd)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-bold">
                        {formatPrice(item.lineTotalUsd)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SheetFooter className="border-t pt-4">
              <div className="mb-3 flex w-full justify-between text-sm font-bold">
                <span>Toplam</span>
                <div className="text-right">
                  <div>{formatPrice(cart.totalUsd)}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {formatPrice(cart.totalTl, "TL")}
                  </div>
                </div>
              </div>
              <Link href="/sepet" className="w-full" onClick={() => setOpen(false)}>
                <Button className="w-full" size="sm">
                  Sepete Git
                </Button>
              </Link>
              <Link href="/sepet" className="w-full" onClick={() => setOpen(false)}>
                <Button
                  className="w-full gap-1.5 bg-green-600 text-white hover:bg-green-700"
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Sipariş
                </Button>
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
