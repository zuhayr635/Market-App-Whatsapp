"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  type CartData,
  fetchCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  formatPrice,
} from "@/lib/cart"

interface UserAddress {
  id: string
  title: string
  fullAddress: string
  city: { name: string }
  district: { name: string }
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [orderNote, setOrderNote] = useState("")
  const [sending, setSending] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const loadCart = useCallback(async () => {
    try {
      const data = await fetchCart()
      setCart(data)
    } catch {
      toast.error("Sepet yüklenemedi")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/user/addresses")
      if (res.ok) {
        const data = await res.json()
        setAddresses(data)
        const defaultAddr = data.find((a: UserAddress & { isDefault?: boolean }) => a.isDefault)
        if (defaultAddr) setSelectedAddressId(defaultAddr.id)
        else if (data.length > 0) setSelectedAddressId(data[0].id)
      }
    } catch {
      // silently fail - addresses are optional
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/giris")
      return
    }
    if (status === "authenticated") {
      loadCart()
      loadAddresses()
    }
  }, [status, router, loadCart, loadAddresses])

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return
    setUpdating(itemId)
    try {
      await updateCartItem(itemId, newQty)
      await loadCart()
      window.dispatchEvent(new CustomEvent("cart-updated"))
    } catch {
      toast.error("Güncelleme başarısız")
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      await removeCartItem(itemId)
      await loadCart()
      window.dispatchEvent(new CustomEvent("cart-updated"))
      toast.success("Ürün sepetten kaldırıldı")
    } catch {
      toast.error("Silme başarısız")
    } finally {
      setUpdating(null)
    }
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
      await loadCart()
      window.dispatchEvent(new CustomEvent("cart-updated"))
      toast.success("Sepet temizlendi")
    } catch {
      toast.error("Sepet temizlenemedi")
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponError('')
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          orderAmount: cart ? cart.totalTl : 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCouponError(data.error || 'Geçersiz kupon')
        setAppliedCoupon(null)
        setCouponDiscount(0)
        return
      }
      setAppliedCoupon(data.coupon)
      setCouponDiscount(data.coupon.discount)
      toast.success(`Kupon uygulandı! ${data.coupon.discount} TL indirim kazandınız.`)
    } catch {
      setCouponError('Kupon doğrulanamadı')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponDiscount(0)
    setCouponCode('')
    setCouponError('')
  }

  const handleWhatsAppOrder = async () => {
    if (!cart || cart.items.length === 0) return
    setSending(true)
    try {
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId)
      const addressText = selectedAddress
        ? `${selectedAddress.title}: ${selectedAddress.fullAddress}, ${selectedAddress.district.name}/${selectedAddress.city.name}`
        : undefined

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId || undefined,
          orderNote: orderNote || undefined,
          addressText,
          couponCode: appliedCoupon?.code || undefined,
          discountAmount: couponDiscount || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Sipariş oluşturulamadı")
      }

      const { whatsappUrl } = await res.json()
      window.dispatchEvent(new CustomEvent("cart-updated"))
      window.open(whatsappUrl, "_blank")
      router.push("/siparislerim")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sipariş gönderilemedi")
    } finally {
      setSending(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-12">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold">Sepetiniz Boş</h1>
        <p className="text-muted-foreground">Henüz sepetinize ürün eklemediniz.</p>
        <Link href="/urunler">
          <Button>Alışverişe Başla</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sepetim ({cart.items.length} ürün)</h1>
        <Button variant="outline" size="sm" onClick={handleClearCart}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          Sepeti Temizle
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="space-y-4 lg:col-span-2">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-lg border bg-card p-4"
            >
              {/* Image */}
              <Link
                href={`/urun/${item.product.slug}`}
                className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {item.variation?.imageUrl || item.product.image ? (
                  <Image
                    src={item.variation?.imageUrl || item.product.image || ""}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/urun/${item.product.slug}`}
                  className="font-medium hover:underline"
                >
                  {item.product.name}
                </Link>
                {item.variation && (
                  <p className="text-xs text-muted-foreground">
                    {Object.entries(item.variation.combination)
                      .map(([, v]) => v)
                      .join(", ")}
                  </p>
                )}
                <p className="text-sm font-semibold">
                  {formatPrice(item.unitPriceTl, "TL")}
                </p>
              </div>

              {/* Quantity + Actions */}
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={updating === item.id}
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || updating === item.id}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {updating === item.id ? (
                      <Loader2 className="mx-auto h-3 w-3 animate-spin" />
                    ) : (
                      item.quantity
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={updating === item.id}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-sm font-bold">
                  {formatPrice(item.lineTotalTl, "TL")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-4 text-lg font-bold">Sipariş Özeti</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span className="font-medium">{formatPrice(cart.totalTl, "TL")}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Kupon İndirimi ({appliedCoupon?.code})</span>
                  <span className="font-medium">-{formatPrice(couponDiscount, "TL")}</span>
                </div>
              )}
              <div className="my-2 h-px bg-border" />
              <div className="flex justify-between text-base font-bold">
                <span>Toplam</span>
                <span>{formatPrice(Math.max(0, cart.totalTl - couponDiscount), "TL")}</span>
              </div>
            </div>

            {/* Coupon Input */}
            <div className="mt-4 border-t pt-4">
              <h3 className="mb-2 text-sm font-semibold">Kupon Kodu</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
                  <span className="font-mono font-semibold text-green-700">{appliedCoupon.code}</span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Kaldır
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                      placeholder="Kupon kodunu girin"
                      className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Uygula'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="mt-1 text-xs text-red-500">{couponError}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Address Selection */}
          {addresses.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">Teslimat Adresi</h3>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
              >
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.title} - {addr.district.name}/{addr.city.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Order Note */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold">Sipariş Notu</h3>
            <Textarea
              placeholder="Siparişinizle ilgili not ekleyin..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full gap-2 bg-green-600 text-white hover:bg-green-700"
              size="lg"
              onClick={handleWhatsAppOrder}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MessageCircle className="h-5 w-5" />
              )}
              {sending ? "Gönderiliyor..." : "WhatsApp ile Sipariş Ver"}
            </Button>

            <Link href="/urunler" className="block">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Alışverişe Devam Et
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
