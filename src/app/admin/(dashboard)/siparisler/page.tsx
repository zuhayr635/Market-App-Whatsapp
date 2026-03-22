"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, Search, Package, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  orderNo: string
  totalUsd: number
  status: string
  createdAt: string
  user: { name: string; surname: string; email: string }
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

const STATUS_TABS = [
  { value: "ALL", label: "Tümü" },
  { value: "PENDING", label: "Beklemede" },
  { value: "RECEIPT_UPLOADED", label: "Dekont Bekliyor" },
  { value: "PAYMENT_CONFIRMED", label: "Onaylandı" },
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "SHIPPED", label: "Kargoda" },
  { value: "DELIVERED", label: "Teslim Edildi" },
  { value: "CANCELLED", label: "İptal" },
]

export default function SiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (debouncedSearch) params.set("search", debouncedSearch)

      const res = await fetch(`/api/admin/orders?${params}`)
      if (res.ok) {
        const d = await res.json()
        setOrders(d.orders)
        setTotal(d.total)
        setTotalPages(d.totalPages)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, debouncedSearch])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Siparişler</h1>
          <p className="text-sm text-muted-foreground">Toplam {total} sipariş</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Sipariş no, müşteri adı veya email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-[1fr_1.5fr_100px_130px_100px_80px] items-center gap-3 border-b bg-gray-50/50 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <div>Sipariş No</div>
          <div>Müşteri</div>
          <div>Toplam</div>
          <div>Durum</div>
          <div>Tarih</div>
          <div />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="mb-3 h-10 w-10" />
            <p className="text-sm">Sipariş bulunamadı</p>
          </div>
        ) : (
          orders.map((order) => {
            const st = statusMap[order.status] || statusMap.PENDING
            return (
              <div
                key={order.id}
                className="grid grid-cols-[1fr_1.5fr_100px_130px_100px_80px] items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-gray-50/50"
              >
                <div className="font-mono text-sm font-medium">{order.orderNo}</div>
                <div>
                  <p className="text-sm font-medium">{order.user.name} {order.user.surname}</p>
                  <p className="text-xs text-muted-foreground">{order.user.email}</p>
                </div>
                <div className="text-sm font-semibold">${order.totalUsd.toFixed(2)}</div>
                <div>
                  <Badge className={`border text-xs ${st.className}`} variant="outline">
                    {st.label}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                </div>
                <div>
                  <Link href={`/admin/siparisler/${order.id}`}>
                    <Button size="sm" variant="outline">Detay</Button>
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
