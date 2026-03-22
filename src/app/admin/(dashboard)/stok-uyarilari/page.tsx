'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Bell, SendHorizonal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface StockAlert {
  id: string
  productId: string
  email: string
  isNotified: boolean
  createdAt: string
  product: {
    name: string
    slug: string
    stockQty: number
  }
}

export default function StokUyarilariPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [notifyingProductId, setNotifyingProductId] = useState<string | null>(null)

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/admin/stock-alerts')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data)
      }
    } catch {
      toast.error('Stok uyarıları yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleNotifyAll = async (productId: string, productName: string) => {
    setNotifyingProductId(productId)
    try {
      const res = await fetch('/api/admin/stock-alerts/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${productName} için ${data.notified} kişiye bildirim gönderildi`)
      loadAlerts()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bildirim gönderilemedi')
    } finally {
      setNotifyingProductId(null)
    }
  }

  // Group alerts by productId
  const productGroups = alerts.reduce<
    Record<string, { productId: string; product: StockAlert['product']; alerts: StockAlert[] }>
  >((acc, alert) => {
    const key = alert.productId
    if (!acc[key]) {
      acc[key] = { productId: alert.productId, product: alert.product, alerts: [] }
    }
    acc[key].alerts.push(alert)
    return acc
  }, {})

  const pendingCount = alerts.filter((a) => !a.isNotified).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stok Uyarıları</h1>
        <p className="text-muted-foreground">
          Stok bekleme listesindeki müşteriler
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              {pendingCount} bekleyen
            </span>
          )}
        </p>
      </div>

      {Object.keys(productGroups).length > 0 && (
        <div className="space-y-4">
          {Object.values(productGroups).map((group) => {
            const pendingAlerts = group.alerts.filter((a) => !a.isNotified)
            const hasStock = group.product.stockQty > 0
            return (
              <Card key={group.productId}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{group.product.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Stok:{' '}
                        <span className={hasStock ? 'text-green-600' : 'text-red-600'}>
                          {hasStock ? `${group.product.stockQty} adet` : 'Tükendi'}
                        </span>
                        {' · '}
                        {group.alerts.length} kayıt
                        {pendingAlerts.length > 0 && ` · ${pendingAlerts.length} bekleyen`}
                      </p>
                    </div>
                    {pendingAlerts.length > 0 && hasStock && (
                      <Button
                        size="sm"
                        className="gap-1"
                        disabled={notifyingProductId === group.productId}
                        onClick={() => handleNotifyAll(group.productId, group.product.name)}
                      >
                        <SendHorizonal className="h-3.5 w-3.5" />
                        {notifyingProductId === group.productId
                          ? 'Gönderiliyor...'
                          : `${pendingAlerts.length} Kişiye Bildir`}
                      </Button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium text-muted-foreground">E-posta</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Durum</th>
                          <th className="pb-2 text-left font-medium text-muted-foreground">Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.alerts.map((alert) => (
                          <tr key={alert.id} className="border-b last:border-0">
                            <td className="py-2">{alert.email}</td>
                            <td className="py-2">
                              {alert.isNotified ? (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                  Bildirildi
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
                                  Bekliyor
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {new Date(alert.createdAt).toLocaleDateString('tr-TR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <Bell className="h-10 w-10 opacity-30" />
            <p>Henüz stok uyarısı yok</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-16 text-muted-foreground">Yükleniyor...</div>
      )}
    </div>
  )
}
