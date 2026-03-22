"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Loader2, ArrowLeft, Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface OrderDetail {
  id: string
  orderNo: string
  status: string
  totalUsd: number
  totalTl: number
  orderNote: string | null
  adminNote: string | null
  createdAt: string
  addressJson: Record<string, string> | null
  user: { id: string; name: string; surname: string; email: string; phone: string }
  items: {
    id: string
    productName: string
    variationJson: Record<string, string> | null
    quantity: number
    unitPrice: number
    totalPrice: number
  }[]
  history: { id: string; status: string; description: string | null; createdAt: string }[]
  paymentLinks: { id: string; linkCode: string; expiresAt: string; status: boolean }[]
  receipts: {
    id: string
    fileUrl: string
    payerName: string | null
    amount: number | null
    status: string
    rejectReason: string | null
    uploadedAt: string
  }[]
  shipping: {
    trackingNo: string
    companyId: string
    company: { name: string }
  } | null
}

interface ShippingCompany {
  id: string
  name: string
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

const ALL_STATUSES = Object.keys(statusMap)

export default function AdminSiparisDetayPage() {
  const params = useParams()
  const id = params.id as string

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([])

  const [newStatus, setNewStatus] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [updating, setUpdating] = useState(false)

  const [paymentLinkUrl, setPaymentLinkUrl] = useState("")
  const [creatingLink, setCreatingLink] = useState(false)
  const [copied, setCopied] = useState(false)

  const [shippingCompanyId, setShippingCompanyId] = useState("")
  const [trackingNo, setTrackingNo] = useState("")
  const [savingShipping, setSavingShipping] = useState(false)

  const [rejectReason, setRejectReason] = useState("")

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`)
      if (res.ok) {
        const d = await res.json()
        setOrder(d)
        setNewStatus(d.status)
        setAdminNote(d.adminNote || "")
        if (d.shipping) {
          setShippingCompanyId(d.shipping.companyId || "")
          setTrackingNo(d.shipping.trackingNo || "")
        }
        if (d.paymentLinks?.[0]) {
          const baseUrl = window.location.origin
          setPaymentLinkUrl(`${baseUrl}/odeme/${d.paymentLinks[0].linkCode}`)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
    fetch("/api/admin/shipping-companies").then((r) => r.ok ? r.json() : []).then(setShippingCompanies).catch(() => {})
  }, [load])

  const handleUpdateStatus = async () => {
    if (!order) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote }),
      })
      if (res.ok) {
        toast.success("Sipariş güncellendi")
        load()
      } else {
        const d = await res.json()
        toast.error(d.error || "Güncelleme başarısız")
      }
    } catch {
      toast.error("Güncelleme başarısız")
    } finally {
      setUpdating(false)
    }
  }

  const handleCreatePaymentLink = async () => {
    setCreatingLink(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/payment-link`, { method: "POST" })
      if (res.ok) {
        const d = await res.json()
        setPaymentLinkUrl(d.paymentLink.url)
        toast.success("Ödeme linki oluşturuldu")
        load()
      } else {
        const d = await res.json()
        toast.error(d.error || "Link oluşturulamadı")
      }
    } catch {
      toast.error("Link oluşturulamadı")
    } finally {
      setCreatingLink(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLinkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReceiptAction = async (receiptId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, receiptId, rejectReason: action === "reject" ? rejectReason : undefined }),
      })
      if (res.ok) {
        toast.success(action === "approve" ? "Dekont onaylandı" : "Dekont reddedildi")
        load()
      } else {
        const d = await res.json()
        toast.error(d.error || "İşlem başarısız")
      }
    } catch {
      toast.error("İşlem başarısız")
    }
  }

  const handleSaveShipping = async () => {
    if (!shippingCompanyId || !trackingNo) {
      toast.error("Kargo firması ve takip numarası gerekli")
      return
    }
    setSavingShipping(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: shippingCompanyId, trackingNo }),
      })
      if (res.ok) {
        toast.success("Kargo bilgisi kaydedildi")
        load()
      } else {
        const d = await res.json()
        toast.error(d.error || "Kayıt başarısız")
      }
    } catch {
      toast.error("Kayıt başarısız")
    } finally {
      setSavingShipping(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <p>Sipariş bulunamadı.</p>
        <Link href="/admin/siparisler"><Button>Geri Dön</Button></Link>
      </div>
    )
  }

  const st = statusMap[order.status] || statusMap.PENDING
  const currentIdx = ALL_STATUSES.indexOf(order.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/siparisler">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{order.orderNo}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("tr-TR")}
          </p>
        </div>
        <Badge className={`ml-auto border ${st.className}`} variant="outline">
          {st.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Status Timeline */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-4 font-semibold">Durum Zaman Çizelgesi</h2>
            <div className="flex items-start overflow-x-auto pb-2">
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

          {/* Items Table */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Sipariş Kalemleri</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Ürün</th>
                    <th className="pb-2 pr-4">Varyasyon</th>
                    <th className="pb-2 pr-4 text-center">Adet</th>
                    <th className="pb-2 pr-4 text-right">Birim Fiyat</th>
                    <th className="pb-2 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-4 font-medium">{item.productName}</td>
                      <td className="py-2 pr-4 text-muted-foreground text-xs">
                        {item.variationJson ? Object.values(item.variationJson).join(", ") : "-"}
                      </td>
                      <td className="py-2 pr-4 text-center">{item.quantity}</td>
                      <td className="py-2 pr-4 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 text-right font-semibold">${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-bold">
                    <td colSpan={4} className="pt-2 text-right">Toplam</td>
                    <td className="pt-2 text-right">
                      <div>${order.totalUsd.toFixed(2)}</div>
                      <div className="text-xs font-normal text-muted-foreground">{order.totalTl.toFixed(2)} ₺</div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Receipts */}
          {order.receipts.length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 font-semibold">Dekontlar</h2>
              <div className="space-y-3">
                {order.receipts.map((r) => (
                  <div key={r.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Dekontu Görüntüle
                        </a>
                        {r.payerName && <p className="text-xs text-muted-foreground">Ödeyen: {r.payerName}</p>}
                        {r.amount && <p className="text-xs text-muted-foreground">Tutar: {r.amount.toFixed(2)}</p>}
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.uploadedAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          r.status === "APPROVED"
                            ? "border-green-200 bg-green-100 text-green-700"
                            : r.status === "REJECTED"
                            ? "border-red-200 bg-red-100 text-red-700"
                            : "border-yellow-200 bg-yellow-100 text-yellow-700"
                        }
                      >
                        {r.status === "APPROVED" ? "Onaylandı" : r.status === "REJECTED" ? "Reddedildi" : "Bekliyor"}
                      </Badge>
                    </div>
                    {r.status === "PENDING" && (
                      <div className="mt-3 space-y-2">
                        <Input
                          placeholder="Red nedeni (opsiyonel)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleReceiptAction(r.id, "approve")}
                          >
                            Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReceiptAction(r.id, "reject")}
                          >
                            Reddet
                          </Button>
                        </div>
                      </div>
                    )}
                    {r.status === "REJECTED" && r.rejectReason && (
                      <p className="mt-2 text-xs text-red-600">Red nedeni: {r.rejectReason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order History */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Sipariş Geçmişi</h2>
            <div className="space-y-2">
              {order.history.map((h) => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">{statusMap[h.status]?.label || h.status}</p>
                    {h.description && <p className="text-muted-foreground">{h.description}</p>}
                    <p className="text-xs text-muted-foreground/60">
                      {new Date(h.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Customer Info */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-2 font-semibold">Müşteri</h2>
            <p className="font-medium">{order.user.name} {order.user.surname}</p>
            <p className="text-sm text-muted-foreground">{order.user.email}</p>
            <p className="text-sm text-muted-foreground">{order.user.phone}</p>
          </div>

          {/* Address */}
          {order.addressJson && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-2 font-semibold">Teslimat Adresi</h2>
              <p className="text-sm font-medium">{order.addressJson.title}</p>
              <p className="text-sm text-muted-foreground">{order.addressJson.fullAddress}</p>
              <p className="text-sm text-muted-foreground">
                {order.addressJson.district} / {order.addressJson.city}
              </p>
            </div>
          )}

          {/* Status Update */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Durum Güncelle</h2>
            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{statusMap[s]?.label || s}</option>
                ))}
              </select>
              <Textarea
                placeholder="Admin notu..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
              />
              <Button className="w-full" onClick={handleUpdateStatus} disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Güncelle
              </Button>
            </div>
          </div>

          {/* Payment Link */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Ödeme Linki</h2>
            {paymentLinkUrl ? (
              <div className="space-y-2">
                <div className="rounded-md bg-muted p-2 text-xs break-all">{paymentLinkUrl}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={handleCopyLink}>
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Kopyalandı" : "Kopyala"}
                  </Button>
                  <a href={paymentLinkUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleCreatePaymentLink}
                disabled={creatingLink}
              >
                {creatingLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ödeme Linki Oluştur
              </Button>
            )}
          </div>

          {/* Shipping */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 font-semibold">Kargo Bilgisi</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Kargo Firması</Label>
                <select
                  value={shippingCompanyId}
                  onChange={(e) => setShippingCompanyId(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Seçiniz</option>
                  {shippingCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Takip Numarası</Label>
                <Input
                  className="mt-1"
                  placeholder="Takip no"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                />
              </div>
              <Button className="w-full" variant="outline" onClick={handleSaveShipping} disabled={savingShipping}>
                {savingShipping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kargo Kaydet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
