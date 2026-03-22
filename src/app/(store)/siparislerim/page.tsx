"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Package, Loader2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  orderNo: string
  totalUsd: number
  totalTl: number
  status: string
  createdAt: string
  items: { id: string; productName: string; quantity: number }[]
}

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Beklemede", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  IBAN_SENT: { label: "IBAN Gönderildi", className: "bg-blue-100 text-blue-700 border-blue-200" },
  PAYMENT_WAITING: { label: "Ödeme Bekleniyor", className: "bg-orange-100 text-orange-700 border-orange-200" },
  RECEIPT_UPLOADED: { label: "Dekont Yüklendi", className: "bg-purple-100 text-purple-700 border-purple-200" },
  PAYMENT_CONFIRMED: { label: "Ödeme Onaylandı", className: "bg-green-100 text-green-700 border-green-200" },
  PREPARING: { label: "Hazırlanıyor", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  SHIPPED: { label: "Kargoya Verildi", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  DELIVERED: { label: "Teslim Edildi", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "İptal Edildi", className: "bg-red-100 text-red-700 border-red-200" },
  RETURNED: { label: "İade Edildi", className: "bg-gray-100 text-gray-700 border-gray-200" },
}

export default function SiparislerimPage() {
  const { status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/user/orders")
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/giris")
      return
    }
    if (status === "authenticated") {
      loadOrders()
    }
  }, [status, router, loadOrders])

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Siparişlerim</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Package className="h-16 w-16 text-muted-foreground/40" />
          <p className="text-muted-foreground">Henüz siparişiniz bulunmuyor.</p>
          <Link href="/urunler">
            <Button>Alışverişe Başla</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const st = statusMap[order.status] || statusMap.PENDING
            return (
              <div key={order.id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.orderNo}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {order.items.slice(0, 2).map((i) => i.productName).join(", ")}
                      {order.items.length > 2 && ` +${order.items.length - 2} ürün`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={`border text-xs ${st.className}`}
                      variant="outline"
                    >
                      {st.label}
                    </Badge>
                    <p className="font-bold">${order.totalUsd.toFixed(2)}</p>
                    <Link href={`/siparislerim/${order.id}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        Detay
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
