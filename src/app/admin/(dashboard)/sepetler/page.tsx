"use client"

import { useEffect, useState, useCallback } from "react"
import { ShoppingCart, User, RefreshCw, ImageIcon, ChevronDown, ChevronRight } from "lucide-react"
import Image from "next/image"

interface CartItem {
  id: string
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  quantity: number
  unitPriceTl: number
  lineTotalTl: number
}

interface UserCart {
  cartId: string
  user: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
  }
  itemCount: number
  totalTl: number
  items: CartItem[]
  updatedAt: string
}

export default function SepetlerPage() {
  const [carts, setCarts] = useState<UserCart[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchCarts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/sepetler")
      if (res.ok) setCarts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCarts() }, [fetchCarts])

  const toggleExpand = (cartId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(cartId)) next.delete(cartId)
      else next.add(cartId)
      return next
    })
  }

  const surface = { backgroundColor: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--admin-text)' }}>Kullanıcı Sepetleri</h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--admin-text-muted)' }}>
            {carts.length} aktif sepet
          </p>
        </div>
        <button
          onClick={fetchCarts}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{ backgroundColor: 'var(--admin-teal-dim)', color: 'var(--admin-teal)', border: '1px solid var(--admin-teal-border)' }}
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: 'var(--admin-surface)' }} />
          ))}
        </div>
      ) : carts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl py-20" style={surface}>
          <ShoppingCart className="mb-3 size-12" style={{ color: 'var(--admin-text-muted)' }} />
          <p style={{ color: 'var(--admin-text-muted)' }}>Hiç aktif sepet yok</p>
        </div>
      ) : (
        <div className="space-y-2">
          {carts.map((cart) => {
            const isExpanded = expanded.has(cart.cartId)
            const updatedDate = new Date(cart.updatedAt).toLocaleString("tr-TR")
            return (
              <div key={cart.cartId} className="overflow-hidden rounded-xl" style={surface}>
                {/* Cart row */}
                <button
                  onClick={() => toggleExpand(cart.cartId)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--admin-teal-dim)' }}>
                    <User className="size-4" style={{ color: 'var(--admin-teal)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'var(--admin-text)' }}>
                      {cart.user.name || "İsimsiz Kullanıcı"}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--admin-text-muted)' }}>
                      {cart.user.email || cart.user.phone || cart.user.id}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold" style={{ color: 'var(--admin-teal)' }}>
                      {cart.totalTl.toFixed(2)} ₺
                    </p>
                    <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                      {cart.itemCount} ürün
                    </p>
                  </div>

                  <div className="shrink-0 text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                    <p>{updatedDate}</p>
                  </div>

                  {isExpanded
                    ? <ChevronDown className="size-4 shrink-0" style={{ color: 'var(--admin-text-muted)' }} />
                    : <ChevronRight className="size-4 shrink-0" style={{ color: 'var(--admin-text-muted)' }} />
                  }
                </button>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t px-5 pb-4 pt-3" style={{ borderColor: 'var(--admin-border)' }}>
                    <div className="space-y-3">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg"
                            style={{ backgroundColor: 'var(--admin-surface-2)' }}>
                            {item.productImage ? (
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ImageIcon className="size-4" style={{ color: 'var(--admin-text-muted)' }} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                              {item.productName}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                              {item.quantity} adet × {item.unitPriceTl.toFixed(2)} ₺
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-bold" style={{ color: 'var(--admin-text)' }}>
                            {item.lineTotalTl.toFixed(2)} ₺
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end border-t pt-3" style={{ borderColor: 'var(--admin-border)' }}>
                      <p className="text-sm font-bold" style={{ color: 'var(--admin-teal)' }}>
                        Toplam: {cart.totalTl.toFixed(2)} ₺
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
