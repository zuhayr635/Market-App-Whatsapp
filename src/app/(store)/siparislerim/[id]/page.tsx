"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, CreditCard, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface OrderDetail {
  id: string
  orderNo: string
  status: string
  totalUsd: number
  totalTl: number
  orderNote: string | null
  createdAt: string
  addressJson: Record<string, string> | null
  items: {
    id: string
    productName: string
    variationJson: Record<string, string> | null
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  history: { id: string; status: string; description: string | null; createdAt: string }[]
  paymentLinks: { id: string; linkCode: string; expiresAt: string }[]
  shipping: {
    trackingNo: string
    company: { name: string; trackingUrl: string | null }
  } | null
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

const ALL_STATUSES = [
  "PENDING", "IBAN_SENT", "PAYMENT_WAITING", "RECEIPT_UPLOADED",
  "PAYMENT_CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED",
]

export default function SiparisDetayPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/orders/${id}`)
      if (res.ok) {
        setOrder(await res.json())
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/giris")
      return
    }
    if (status === "authenticated") loadOrder()
  }, [status, router, loadOrder])

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Sipariş bulunamadı.</p>
        <Link href="/siparislerim"><Button className="mt-4">Geri Dön</Button></Link>
      </div>
    )
  }

  const st = statusMap[order.status] || statusMap.PENDING
  const currentIdx = ALL_STATUSES.indexOf(order.status)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/siparislerim">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{order.orderNo}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge className={`ml-auto border ${st.className}`} variant="outline">
          {st.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Status Timeline */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-4 font-semibold">Sipariş Durumu</h2>
            <div className="relative">
              <div className="flex items-start gap-0 overflow-x-auto pb-2">
                {ALL_STATUSES.map((s, idx) => {
                  const done = idx <= currentIdx
                  const info = statusMap[s]
                  return (
                    <div key={s} className="flex min-w-[80px] flex-col items-center">
                      <div className="relative flex w-full items-center">
                        {idx > 0 && (
                          <div className={`h-0.5 flex-1 ${done ? "bg-green-500" : "bg-gray-200"}`} />
                        )}
                        <div
                          className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        {idx < ALL_STATUSES.length - 1 && (
                          <div className={`h-0.5 flex-1 ${done && idx < currentIdx ? "bg-green-500" : "bg-gray-200"}`} />
                        )}
                      </div>
                      <p className="mt-1 text-center text-[9px] text-muted-foreground">{info?.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 font-semibold">Ürünler</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    {item.variationJson && (
                      <p className="text-xs text-muted-foreground">
                        {Object.values(item.variationJson).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} adet
                    </p>
                  </div>
                  <p className="font-semibold">{(Number(item.totalPrice) * order.totalTl / order.totalUsd).toFixed(2)} ₺</p>
                </div>
              ))}
              <div className="border-t pt-2 text-sm font-bold flex justify-between">
                <span>Toplam</span>
                <span>{order.totalTl.toFixed(2)} ₺</span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          {order.shipping && (
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-2 font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Kargo Takip
              </h2>
              <p className="text-sm">
                <span className="font-medium">{order.shipping.company.name}</span>
                {" - "}
                {order.shipping.trackingNo}
              </p>
              {order.shipping.company.trackingUrl && (
                <a
                  href={order.shipping.company.trackingUrl.replace("{trackingNo}", order.shipping.trackingNo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-sm text-primary underline"
                >
                  Kargoyu Takip Et
                </a>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Address */}
          {order.addressJson && (
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-2 font-semibold">Teslimat Adresi</h2>
              <p className="text-sm">{order.addressJson.title}</p>
              <p className="text-sm text-muted-foreground">{order.addressJson.fullAddress}</p>
              <p className="text-sm text-muted-foreground">
                {order.addressJson.district} / {order.addressJson.city}
              </p>
            </div>
          )}

          {/* Payment link if IBAN_SENT */}
          {order.status === "IBAN_SENT" && order.paymentLinks[0] && (
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-2 font-semibold">Ödeme</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Ödeme linkiniz hazır. Aşağıdaki butona tıklayarak ödeme yapabilirsiniz.
              </p>
              <Link href={`/odeme/${order.paymentLinks[0].linkCode}`}>
                <Button className="w-full gap-2">
                  <CreditCard className="h-4 w-4" />
                  Ödeme Yap
                </Button>
              </Link>
            </div>
          )}

          {/* Order note */}
          {order.orderNote && (
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-1 font-semibold">Sipariş Notu</h2>
              <p className="text-sm text-muted-foreground">{order.orderNote}</p>
            </div>
          )}

          {/* History */}
          <div className="rounded-lg border bg-card p-4">
            <h2 className="mb-3 font-semibold">Sipariş Geçmişi</h2>
            <div className="space-y-2">
              {order.history.map((h) => (
                <div key={h.id} className="text-xs">
                  <p className="font-medium">{statusMap[h.status]?.label || h.status}</p>
                  {h.description && <p className="text-muted-foreground">{h.description}</p>}
                  <p className="text-muted-foreground/60">
                    {new Date(h.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
