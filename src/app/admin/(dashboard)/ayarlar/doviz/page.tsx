"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Save } from "lucide-react"

interface RateData {
  rate: number
  lastUpdated: string | null
  source: "manual" | "auto"
}

export default function DovizPage() {
  const [data, setData] = useState<RateData | null>(null)
  const [manualRate, setManualRate] = useState("")
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [autoUpdating, setAutoUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchRate()
    fetchAutoUpdateSetting()
  }, [])

  async function fetchRate() {
    try {
      const res = await fetch("/api/admin/exchange-rate")
      const json = await res.json()
      setData(json)
      setManualRate(String(json.rate ?? ""))
    } catch {
      setMessage({ type: "error", text: "Kur bilgisi alınamadı" })
    }
  }

  async function fetchAutoUpdateSetting() {
    try {
      const res = await fetch("/api/settings?key=usd_auto_update")
      if (res.ok) {
        const json = await res.json()
        setAutoUpdate(json.value === "true")
      }
    } catch {
      // ignore
    }
  }

  async function handleSave() {
    const rate = parseFloat(manualRate)
    if (isNaN(rate) || rate <= 0) {
      setMessage({ type: "error", text: "Geçerli bir kur değeri girin" })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/admin/exchange-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Kaydetme başarısız")
      }

      setMessage({ type: "success", text: "Kur başarıyla kaydedildi" })
      fetchRate()
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Hata oluştu" })
    } finally {
      setSaving(false)
    }
  }

  async function handleAutoUpdate() {
    setAutoUpdating(true)
    setMessage(null)

    try {
      const res = await fetch("/api/admin/exchange-rate", { method: "PUT" })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Otomatik güncelleme başarısız")
      }

      const json = await res.json()
      setMessage({ type: "success", text: `Kur güncellendi: 1 USD = ${json.rate.toFixed(4)} TL` })
      fetchRate()
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Hata oluştu" })
    } finally {
      setAutoUpdating(false)
    }
  }

  async function handleAutoUpdateToggle(checked: boolean) {
    setAutoUpdate(checked)
    try {
      await fetch("/api/admin/exchange-rate/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "usd_auto_update", value: String(checked) }),
      })
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Döviz Kuru</h1>
        <p className="text-muted-foreground">USD/TL kur ayarlarını yönetin</p>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Güncel Kur</CardTitle>
          <CardDescription>Sistemde kullanılan aktif USD/TL kuru</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">1 USD = {Number(data.rate).toFixed(4)} TL</span>
                <Badge variant={data.source === "auto" ? "default" : "secondary"}>
                  {data.source === "auto" ? "Otomatik" : "Manuel"}
                </Badge>
              </div>
              {data.lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  Son güncelleme:{" "}
                  {new Date(data.lastUpdated).toLocaleString("tr-TR")}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Yükleniyor...</p>
          )}
        </CardContent>
      </Card>

      {/* Manual Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Manuel Kur Girişi</CardTitle>
          <CardDescription>USD/TL kurunu manuel olarak belirleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="rate">1 USD = ? TL</Label>
              <Input
                id="rate"
                type="number"
                step="0.0001"
                min="0"
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value)}
                placeholder="Örn: 32.50"
                className="w-48"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto Update */}
      <Card>
        <CardHeader>
          <CardTitle>Otomatik Güncelleme</CardTitle>
          <CardDescription>
            open.er-api.com üzerinden güncel kuru otomatik çekin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Otomatik kur güncelleme</p>
              <p className="text-sm text-muted-foreground">
                Açıkken kur otomatik olarak güncellenir
              </p>
            </div>
            <button
              role="switch"
              aria-checked={autoUpdate}
              onClick={() => handleAutoUpdateToggle(!autoUpdate)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                autoUpdate ? "bg-primary focus:ring-primary" : "bg-muted-foreground/30 focus:ring-muted-foreground"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoUpdate ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <Button
            variant="outline"
            onClick={handleAutoUpdate}
            disabled={autoUpdating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoUpdating ? "animate-spin" : ""}`} />
            {autoUpdating ? "Güncelleniyor..." : "Otomatik Güncelle"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Kaynak: open.er-api.com — Ücretsiz, API anahtarı gerektirmez
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
