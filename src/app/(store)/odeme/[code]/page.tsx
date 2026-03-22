"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Loader2, Upload, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface IbanInfo {
  id: string
  bankName: string
  iban: string
  accountHolder: string
  branchCode: string | null
  currency: string
}

interface OrderItem {
  id: string
  productName: string
  variationJson: Record<string, string> | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface PaymentData {
  order: {
    id: string
    orderNo: string
    totalUsd: number
    totalTl: number
    status: string
    items: OrderItem[]
  }
  paymentLink: {
    id: string
    expiresAt: string
    status: boolean
  }
}

export default function OdemePage() {
  const params = useParams()
  const code = params.code as string

  const [data, setData] = useState<PaymentData | null>(null)
  const [ibans, setIbans] = useState<IbanInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [payerName, setPayerName] = useState("")
  const [paymentDate, setPaymentDate] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const [linkRes, ibanRes] = await Promise.all([
        fetch(`/api/payment/${code}`),
        fetch("/api/iban/public"),
      ])

      if (!linkRes.ok) {
        const d = await linkRes.json()
        setError(d.error || "Ödeme linki bulunamadı")
        return
      }

      setData(await linkRes.json())
      if (ibanRes.ok) setIbans(await ibanRes.json())
    } catch {
      setError("Sayfa yüklenirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async () => {
    if (!file || !data) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("orderId", data.order.id)
      if (payerName) formData.append("payerName", payerName)
      if (paymentDate) formData.append("paymentDate", paymentDate)
      if (amount) formData.append("amount", amount)
      if (note) formData.append("note", note)

      const res = await fetch("/api/receipts/upload", { method: "POST", body: formData })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Yükleme başarısız")
      }
      setSuccess(true)
      toast.success("Dekont başarıyla yüklendi! Onay bekleniyor.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yükleme başarısız")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-lg font-semibold text-destructive">{error}</p>
        <p className="text-sm text-muted-foreground">
          Bu ödeme linki geçersiz veya süresi dolmuş olabilir.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-xl font-bold">Dekontunuz Alındı</h2>
        <p className="text-muted-foreground">
          Ödemeniz inceleniyor. Onaylandığında siparişiniz işleme alınacaktır.
        </p>
      </div>
    )
  }

  if (!data) return null

  const { order } = data
  const expired = data.paymentLink && new Date(data.paymentLink.expiresAt) < new Date()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Ödeme Sayfası</h1>
        <p className="text-muted-foreground">Sipariş No: {order.orderNo}</p>
      </div>

      {expired && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-center text-red-700">
          Bu ödeme linkinin süresi dolmuştur.
        </div>
      )}

      {/* Order Summary */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <h2 className="mb-3 font-semibold">Sipariş Özeti</h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productName}
                {item.variationJson && ` (${Object.values(item.variationJson).join(", ")})`}
                {" "}x{item.quantity}
              </span>
              <span>${item.totalPrice.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 font-bold flex justify-between">
            <span>Toplam</span>
            <div className="text-right">
              <div>${order.totalUsd.toFixed(2)}</div>
              <div className="text-xs font-normal text-muted-foreground">{order.totalTl.toFixed(2)} ₺</div>
            </div>
          </div>
        </div>
      </div>

      {/* IBAN List */}
      {ibans.length > 0 && (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <h2 className="mb-3 font-semibold">Banka Hesap Bilgileri</h2>
          <div className="space-y-4">
            {ibans.map((iban) => (
              <div key={iban.id} className="rounded-md bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{iban.bankName}</p>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {iban.currency}
                  </span>
                </div>
                <p className="mt-1 font-mono text-sm">{iban.iban}</p>
                <p className="text-sm text-muted-foreground">Hesap Sahibi: {iban.accountHolder}</p>
                {iban.branchCode && (
                  <p className="text-sm text-muted-foreground">Şube: {iban.branchCode}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipt Upload */}
      {!expired && order.status !== "PAYMENT_CONFIRMED" && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-4 font-semibold">Dekont Yükle</h2>
          <div className="space-y-4">
            <div>
              <Label>Dekont Dosyası *</Label>
              <div className="mt-1">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border-2 border-dashed p-4 transition-colors hover:border-primary">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : "Dosya seçin (JPG, PNG, PDF)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Ödeme Yapan Ad Soyad</Label>
                <Input
                  className="mt-1"
                  placeholder="Ad Soyad"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                />
              </div>
              <div>
                <Label>Ödeme Tarihi</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Ödenen Tutar</Label>
              <Input
                className="mt-1"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label>Not (İsteğe Bağlı)</Label>
              <Textarea
                className="mt-1"
                rows={2}
                placeholder="Ödeme ile ilgili not..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={!file || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {submitting ? "Yükleniyor..." : "Ödeme Yaptım - Dekontu Gönder"}
            </Button>
          </div>
        </div>
      )}

      {order.status === "PAYMENT_CONFIRMED" && (
        <div className="rounded-lg bg-green-50 p-6 text-center text-green-700">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8" />
          <p className="font-semibold">Ödemeniz Onaylandı</p>
        </div>
      )}
    </div>
  )
}
