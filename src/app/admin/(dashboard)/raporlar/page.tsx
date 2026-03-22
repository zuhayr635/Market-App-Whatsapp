"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download } from "lucide-react"

type ReportType = "orders" | "revenue" | "products"
type DaysRange = 7 | 30 | 90

interface OrderDataPoint {
  date: string
  count: number
}

interface RevenueDataPoint {
  date: string
  revenue: number
}

interface ProductDataPoint {
  productId: string
  name: string
  sku: string
  totalQty: number
}

function BarChart({ data, valueKey, labelKey, color }: {
  data: Record<string, unknown>[]
  valueKey: string
  labelKey: string
  color: string
}) {
  const values = data.map((d) => Number(d[valueKey]) || 0)
  const maxValue = Math.max(...values, 1)

  return (
    <div className="flex items-end gap-1 h-48 mt-4 overflow-x-auto pb-6">
      {data.map((item, i) => {
        const val = Number(item[valueKey]) || 0
        const heightPct = (val / maxValue) * 100
        const label = String(item[labelKey])
        const shortLabel = label.length > 5 ? label.slice(5) : label

        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1 flex-1 min-w-[24px] group relative"
          >
            <div className="w-full flex items-end" style={{ height: "140px" }}>
              <div
                className={`w-full rounded-t transition-all ${color}`}
                style={{
                  height: `${heightPct}%`,
                  minHeight: val > 0 ? "4px" : "0",
                }}
              />
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
              {label}: {val}
            </div>
            <span className="text-xs text-muted-foreground" style={{ fontSize: "10px" }}>
              {shortLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ProductBars({ data }: { data: ProductDataPoint[] }) {
  const max = Math.max(...data.map((d) => d.totalQty), 1)

  return (
    <div className="space-y-3 mt-4">
      {data.map((item, i) => {
        const pct = (item.totalQty / max) * 100
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-40 truncate text-sm text-right shrink-0" title={item.name}>
              {item.name}
            </div>
            <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded flex items-center px-2 text-white text-xs font-bold transition-all"
                style={{ width: `${pct}%`, minWidth: item.totalQty > 0 ? "30px" : "0" }}
              >
                {item.totalQty}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))
  const csv = [headers.join(","), ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function RaporlarPage() {
  const [activeTab, setActiveTab] = useState<ReportType>("orders")
  const [days, setDays] = useState<DaysRange>(30)
  const [ordersData, setOrdersData] = useState<OrderDataPoint[]>([])
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [productsData, setProductsData] = useState<ProductDataPoint[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (type: ReportType, d: DaysRange) => {
    setLoading(true)
    const res = await fetch(`/api/admin/reports?type=${type}&days=${d}`)
    if (res.ok) {
      const data = await res.json()
      if (type === "orders") setOrdersData(data)
      else if (type === "revenue") setRevenueData(data)
      else setProductsData(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData(activeTab, days)
  }, [activeTab, days, fetchData])

  function handleTabChange(tab: string) {
    setActiveTab(tab as ReportType)
  }

  function handleDaysChange(d: DaysRange) {
    setDays(d)
  }

  const daysOptions: DaysRange[] = [7, 30, 90]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Raporlar</h1>
          <p className="text-muted-foreground">Sipariş, gelir ve ürün analizleri</p>
        </div>
        <div className="flex gap-2">
          {daysOptions.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "default" : "outline"}
              onClick={() => handleDaysChange(d)}
            >
              Son {d} gün
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="orders">Siparişler</TabsTrigger>
          <TabsTrigger value="revenue">Gelir</TabsTrigger>
          <TabsTrigger value="products">Ürünler</TabsTrigger>
        </TabsList>

        {/* Orders */}
        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Günlük Sipariş Sayısı</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCSV(
                    ordersData as unknown as Record<string, unknown>[],
                    `siparisler-son-${days}gun.csv`
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" />
                CSV İndir
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12 text-muted-foreground">Yükleniyor...</div>
              ) : ordersData.length === 0 ? (
                <div className="flex justify-center py-12 text-muted-foreground">Veri bulunamadı</div>
              ) : (
                <>
                  <div className="flex gap-6 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
                      <p className="text-2xl font-bold">
                        {ordersData.reduce((s, d) => s + d.count, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Günlük Ortalama</p>
                      <p className="text-2xl font-bold">
                        {(ordersData.reduce((s, d) => s + d.count, 0) / Math.max(ordersData.length, 1)).toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <BarChart
                    data={ordersData as unknown as Record<string, unknown>[]}
                    valueKey="count"
                    labelKey="date"
                    color="bg-blue-500"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Günlük Gelir (USD)</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCSV(
                    revenueData as unknown as Record<string, unknown>[],
                    `gelir-son-${days}gun.csv`
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" />
                CSV İndir
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12 text-muted-foreground">Yükleniyor...</div>
              ) : revenueData.length === 0 ? (
                <div className="flex justify-center py-12 text-muted-foreground">Veri bulunamadı</div>
              ) : (
                <>
                  <div className="flex gap-6 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Toplam Gelir</p>
                      <p className="text-2xl font-bold">
                        ${revenueData.reduce((s, d) => s + d.revenue, 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Günlük Ortalama</p>
                      <p className="text-2xl font-bold">
                        ${(revenueData.reduce((s, d) => s + d.revenue, 0) / Math.max(revenueData.length, 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <BarChart
                    data={revenueData as unknown as Record<string, unknown>[]}
                    valueKey="revenue"
                    labelKey="date"
                    color="bg-green-500"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>En Çok Sipariş Edilen Ürünler (Top 10)</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCSV(
                    productsData as unknown as Record<string, unknown>[],
                    `urunler-top10.csv`
                  )
                }
              >
                <Download className="h-4 w-4 mr-1" />
                CSV İndir
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12 text-muted-foreground">Yükleniyor...</div>
              ) : productsData.length === 0 ? (
                <div className="flex justify-center py-12 text-muted-foreground">Veri bulunamadı</div>
              ) : (
                <ProductBars data={productsData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
