"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OdemeBasariliPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const orderId = searchParams.get("order_id")
  const [loading, setLoading] = useState(true)
  const [orderNo, setOrderNo] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    fetch(`/api/user/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.orderNo) setOrderNo(data.orderNo)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Ödemeniz Alındı</h1>
        {orderNo && (
          <p className="text-muted-foreground">
            Sipariş No: <span className="font-semibold text-foreground">{orderNo}</span>
          </p>
        )}
        <p className="max-w-sm text-sm text-muted-foreground">
          Ödemeniz başarıyla tamamlandı. Siparişiniz en kısa sürede hazırlanacak.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/siparislerim">
          <Button className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Siparişlerime Git
          </Button>
        </Link>
        <Link href="/urunler">
          <Button variant="outline">Alışverişe Devam Et</Button>
        </Link>
      </div>
    </div>
  )
}
