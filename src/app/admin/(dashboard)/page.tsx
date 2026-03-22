import { db } from "@/lib/db"

export const dynamic = "force-dynamic"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  Users,
  Package,
} from "lucide-react"

async function getDashboardData() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [
    todayOrderCount,
    monthRevenueResult,
    pendingOrderCount,
    totalUserCount,
    recentOrders,
    lowStockProducts,
    last7DaysOrders,
  ] = await Promise.all([
    db.order.count({
      where: { createdAt: { gte: todayStart } },
    }),
    db.order.aggregate({
      _sum: { totalUsd: true },
      where: {
        status: "PAYMENT_CONFIRMED",
        createdAt: { gte: monthStart },
      },
    }),
    db.order.count({ where: { status: "PENDING" } }),
    db.user.count(),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, surname: true } },
      },
    }),
    db.product.findMany({
      where: {
        stockTracking: true,
        stockQty: { lte: 5 },
        status: "PUBLISHED",
      },
      orderBy: { stockQty: "asc" },
      take: 5,
      select: { id: true, name: true, stockQty: true, lowStockThreshold: true, sku: true },
    }),
    db.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const monthRevenue = Number(monthRevenueResult._sum.totalUsd || 0)

  // Group last 7 days orders per day
  const dayMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const key = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })
    dayMap[key] = 0
  }
  for (const order of last7DaysOrders) {
    const key = order.createdAt.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })
    if (key in dayMap) dayMap[key]++
  }

  const chartData = Object.entries(dayMap).map(([date, count]) => ({ date, count }))
  const maxCount = Math.max(...chartData.map((d) => d.count), 1)

  return {
    todayOrderCount,
    monthRevenue,
    pendingOrderCount,
    totalUserCount,
    recentOrders,
    lowStockProducts,
    chartData,
    maxCount,
  }
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Bekliyor", color: "bg-yellow-100 text-yellow-800" },
  IBAN_SENT: { label: "IBAN Gönderildi", color: "bg-blue-100 text-blue-800" },
  PAYMENT_WAITING: { label: "Ödeme Bekleniyor", color: "bg-orange-100 text-orange-800" },
  RECEIPT_UPLOADED: { label: "Dekont Yüklendi", color: "bg-purple-100 text-purple-800" },
  PAYMENT_CONFIRMED: { label: "Onaylandı", color: "bg-green-100 text-green-800" },
  PREPARING: { label: "Hazırlanıyor", color: "bg-indigo-100 text-indigo-800" },
  SHIPPED: { label: "Kargoda", color: "bg-cyan-100 text-cyan-800" },
  DELIVERED: { label: "Teslim Edildi", color: "bg-teal-100 text-teal-800" },
  CANCELLED: { label: "İptal", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "İade", color: "bg-gray-100 text-gray-800" },
}

export default async function AdminDashboardPage() {
  const {
    todayOrderCount,
    monthRevenue,
    pendingOrderCount,
    totalUserCount,
    recentOrders,
    lowStockProducts,
    chartData,
    maxCount,
  } = await getDashboardData()

  const stats = [
    {
      title: "Bugünkü Siparişler",
      value: todayOrderCount.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Bu Ay Ciro (USD)",
      value: `$${monthRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Bekleyen Siparişler",
      value: pendingOrderCount.toString(),
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Toplam Üye",
      value: totalUserCount.toString(),
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bar chart: last 7 days */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Son 7 Gün Sipariş Grafiği
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {chartData.map(({ date, count }) => {
              const heightPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
              return (
                <div key={date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-700">{count}</span>
                  <div className="w-full flex items-end" style={{ height: "100px" }}>
                    <div
                      className="w-full rounded-t bg-blue-500 transition-all"
                      style={{ height: `${heightPct}%`, minHeight: count > 0 ? "4px" : "0" }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Son Siparişler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="mb-3 h-12 w-12 opacity-20" />
                <p>Henüz sipariş bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const st = statusLabels[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-800" }
                  return (
                    <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-sm">{order.orderNo}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.user.name} {order.user.surname}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt.toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">${Number(order.totalUsd).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low stock products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Düşük Stoklu Ürünler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="mb-3 h-12 w-12 opacity-20" />
                <p>Düşük stoklu ürün bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${p.stockQty === 0 ? "text-red-600" : "text-orange-500"}`}>
                        {p.stockQty} adet
                      </span>
                      <p className="text-xs text-muted-foreground">Eşik: {p.lowStockThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
