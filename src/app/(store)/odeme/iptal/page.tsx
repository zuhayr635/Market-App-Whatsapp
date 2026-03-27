"use client"

import Link from "next/link"
import { XCircle, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OdemeIptalPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-12 w-12 text-red-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Ödeme İptal Edildi</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ödeme işleminiz iptal edildi veya tamamlanamadı. Siparişiniz sisteme kaydedildi, tekrar ödeme yapmak için siparişlerinizi kontrol edebilirsiniz.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/sepet">
          <Button className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sepete Dön
          </Button>
        </Link>
        <Link href="/siparislerim">
          <Button variant="outline">Siparişlerime Git</Button>
        </Link>
      </div>
    </div>
  )
}
