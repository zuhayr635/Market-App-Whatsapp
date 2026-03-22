import { db } from "@/lib/db"
import Link from "next/link"
import {
  ShoppingCart, TrendingUp, Clock, Users, Package, ArrowRight,
} from "lucide-react"

export const dynamic = "force-dynamic"

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
    db.order.count({ where: { createdAt: { gte: todayStart } } }),
    db.order.aggregate({
      _sum: { totalUsd: true },
      where: { status: "PAYMENT_CONFIRMED", createdAt: { gte: monthStart } },
    }),
    db.order.count({ where: { status: "PENDING" } }),
    db.user.count(),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, surname: true } } },
    }),
    db.product.findMany({
      where: { stockTracking: true, stockQty: { lte: 5 }, status: "PUBLISHED" },
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

  return { todayOrderCount, monthRevenue, pendingOrderCount, totalUserCount, recentOrders, lowStockProducts, chartData, maxCount }
}

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:           { label: "Bekliyor",         dot: "#F59E0B", bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  IBAN_SENT:         { label: "IBAN Gönderildi",  dot: "#60A5FA", bg: "rgba(96,165,250,0.12)",  text: "#60A5FA" },
  PAYMENT_WAITING:   { label: "Ödeme Bekleniyor", dot: "#FB923C", bg: "rgba(251,146,60,0.12)",  text: "#FB923C" },
  RECEIPT_UPLOADED:  { label: "Dekont Yüklendi",  dot: "#A78BFA", bg: "rgba(167,139,250,0.12)", text: "#A78BFA" },
  PAYMENT_CONFIRMED: { label: "Onaylandı",        dot: "#34D399", bg: "rgba(52,211,153,0.12)",  text: "#34D399" },
  PREPARING:         { label: "Hazırlanıyor",     dot: "#818CF8", bg: "rgba(129,140,248,0.12)", text: "#818CF8" },
  SHIPPED:           { label: "Kargoda",          dot: "#2DD4BF", bg: "rgba(45,212,191,0.12)",  text: "#2DD4BF" },
  DELIVERED:         { label: "Teslim Edildi",    dot: "#2DD4BF", bg: "rgba(45,212,191,0.16)",  text: "#2DD4BF" },
  CANCELLED:         { label: "İptal",            dot: "#F87171", bg: "rgba(248,113,113,0.12)", text: "#F87171" },
  REFUNDED:          { label: "İade",             dot: "#94A3B8", bg: "rgba(148,163,184,0.12)", text: "#94A3B8" },
}

export default async function AdminDashboardPage() {
  const { todayOrderCount, monthRevenue, pendingOrderCount, totalUserCount, recentOrders, lowStockProducts, chartData, maxCount } = await getDashboardData()

  const stats = [
    { title: "Bugünkü Siparişler", value: todayOrderCount.toString(), icon: ShoppingCart, accent: "#2DD4BF", href: "/admin/siparisler" },
    { title: "Bu Ay Ciro",         value: `$${monthRevenue.toFixed(2)}`, icon: TrendingUp,   accent: "#34D399", href: "/admin/raporlar" },
    { title: "Bekleyen Siparişler", value: pendingOrderCount.toString(), icon: Clock,        accent: "#F59E0B", href: "/admin/siparisler" },
    { title: "Toplam Üye",         value: totalUserCount.toString(),     icon: Users,        accent: "#A78BFA", href: "/admin/kullanicilar" },
  ]

  const surface  = "#0E1017"
  const border   = "rgba(255,255,255,0.06)"
  const textMuted = "#475569"
  const textDim  = "#334155"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.title}
              href={stat.href}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                padding: "20px",
                backgroundColor: surface,
                border: `1px solid ${border}`,
                borderRadius: "10px",
                borderLeft: `2px solid ${stat.accent}`,
                textDecoration: "none",
                transition: "background 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: textMuted }}>{stat.title}</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, backgroundColor: `${stat.accent}18` }}>
                  <Icon style={{ width: 15, height: 15, color: stat.accent }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: "28px", fontWeight: 700, color: "#E2E8F0", lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                  {stat.value}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Bar chart ── */}
      <div style={{ backgroundColor: surface, border: `1px solid ${border}`, borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "13px", fontWeight: 600, color: "#CBD5E1", margin: 0 }}>Son 7 Gün — Sipariş Hacmi</h2>
            <p style={{ fontSize: "11px", color: textMuted, marginTop: 2 }}>Günlük sipariş sayısı</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, backgroundColor: "#2DD4BF" }} />
            <span style={{ fontSize: "11px", color: textMuted }}>Siparişler</span>
          </div>
        </div>

        {/* Chart body */}
        <div style={{ position: "relative", height: 120 }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <div key={pct} style={{
              position: "absolute", left: 0, right: 0,
              bottom: `${pct}%`,
              borderTop: `1px solid ${pct === 0 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)"}`,
            }} />
          ))}
          {/* Bars */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: 6, paddingBottom: 0 }}>
            {chartData.map(({ date, count }) => {
              const heightPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
              return (
                <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%" }}>
                    {count > 0 && (
                      <div style={{ marginBottom: 3, textAlign: "center" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#2DD4BF", fontVariantNumeric: "tabular-nums" }}>{count}</span>
                      </div>
                    )}
                    <div
                      style={{
                        width: "100%",
                        height: `${heightPct}%`,
                        minHeight: count > 0 ? 3 : 0,
                        background: count > 0
                          ? "linear-gradient(to top, #2DD4BF, rgba(45,212,191,0.5))"
                          : "rgba(255,255,255,0.04)",
                        borderRadius: "3px 3px 0 0",
                        boxShadow: count > 0 ? "0 0 12px rgba(45,212,191,0.2)" : "none",
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* X axis labels */}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {chartData.map(({ date }) => (
            <div key={date} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: textMuted, fontVariantNumeric: "tabular-nums" }}>{date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom two panels ── */}
      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>

        {/* Recent orders */}
        <div style={{ backgroundColor: surface, border: `1px solid ${border}`, borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShoppingCart style={{ width: 14, height: 14, color: "#2DD4BF" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#CBD5E1" }}>Son Siparişler</span>
            </div>
            <Link href="/admin/siparisler" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "11px", color: textMuted, textDecoration: "none" }}>
              Tümü <ArrowRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px", color: textMuted }}>
              <ShoppingCart style={{ width: 36, height: 36, opacity: 0.2, marginBottom: 12 }} />
              <p style={{ fontSize: "13px" }}>Henüz sipariş bulunmuyor</p>
            </div>
          ) : (
            <div>
              {recentOrders.map((order, i) => {
                const st = statusConfig[order.status] ?? { label: order.status, dot: "#94A3B8", bg: "rgba(148,163,184,0.12)", text: "#94A3B8" }
                return (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 20px",
                      borderBottom: i < recentOrders.length - 1 ? `1px solid ${border}` : "none",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#CBD5E1", fontVariantNumeric: "tabular-nums" }}>{order.orderNo}</p>
                      <p style={{ fontSize: "11px", color: textMuted, marginTop: 1 }}>
                        {order.user.name} {order.user.surname}
                      </p>
                      <p style={{ fontSize: "10px", color: textDim, marginTop: 1 }}>
                        {order.createdAt.toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "#E2E8F0", fontVariantNumeric: "tabular-nums" }}>
                        ${Number(order.totalUsd).toFixed(2)}
                      </p>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        marginTop: 4, padding: "2px 8px", borderRadius: 20,
                        fontSize: "10px", fontWeight: 600,
                        backgroundColor: st.bg, color: st.text,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: st.dot, flexShrink: 0 }} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div style={{ backgroundColor: surface, border: `1px solid ${border}`, borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Package style={{ width: 14, height: 14, color: "#F59E0B" }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#CBD5E1" }}>Düşük Stoklu Ürünler</span>
            </div>
            <Link href="/admin/urunler" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "11px", color: textMuted, textDecoration: "none" }}>
              Tümü <ArrowRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px", color: textMuted }}>
              <Package style={{ width: 36, height: 36, opacity: 0.2, marginBottom: 12 }} />
              <p style={{ fontSize: "13px" }}>Düşük stoklu ürün bulunmuyor</p>
            </div>
          ) : (
            <div>
              {lowStockProducts.map((p, i) => {
                const isEmpty = p.stockQty === 0
                const stockColor = isEmpty ? "#F87171" : "#F59E0B"
                const stockBg   = isEmpty ? "rgba(248,113,113,0.12)" : "rgba(245,158,11,0.12)"
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 20px",
                      borderBottom: i < lowStockProducts.length - 1 ? `1px solid ${border}` : "none",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ fontSize: "10px", color: textMuted, marginTop: 1 }}>SKU: {p.sku}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px", borderRadius: 20,
                        fontSize: "11px", fontWeight: 700,
                        backgroundColor: stockBg, color: stockColor,
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {p.stockQty} adet
                      </span>
                      <p style={{ fontSize: "10px", color: textDim, marginTop: 3 }}>Eşik: {p.lowStockThreshold}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
