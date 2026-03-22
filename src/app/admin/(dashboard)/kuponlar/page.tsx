'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const couponSchema = z.object({
  code: z.string().min(3, 'En az 3 karakter').max(20, 'En fazla 20 karakter'),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.string().min(1, 'Değer gerekli'),
  minOrderAmount: z.string().optional(),
  maxUsageCount: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean(),
})

type CouponForm = z.infer<typeof couponSchema>

interface Coupon {
  id: string
  code: string
  type: 'PERCENTAGE' | 'FIXED'
  value: string
  minOrderAmount: string | null
  maxUsageCount: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function KuponlarPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: { type: 'PERCENTAGE' as const, isActive: true },
  })

  const loadCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons')
      if (res.ok) {
        const data = await res.json()
        setCoupons(data)
      }
    } catch {
      toast.error('Kuponlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const onSubmit = async (data: CouponForm) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.code,
          type: data.type,
          value: parseFloat(data.value),
          minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
          maxUsageCount: data.maxUsageCount ? parseInt(data.maxUsageCount, 10) : null,
          expiresAt: data.expiresAt || null,
          isActive: data.isActive,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Hata oluştu')
      }
      toast.success('Kupon oluşturuldu')
      reset()
      setShowForm(false)
      loadCoupons()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !coupon.isActive,
          expiresAt: coupon.expiresAt,
        }),
      })
      if (!res.ok) throw new Error('Güncelleme başarısız')
      toast.success(coupon.isActive ? 'Kupon pasife alındı' : 'Kupon aktifleştirildi')
      loadCoupons()
    } catch {
      toast.error('Güncelleme başarısız')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Silme başarısız')
      toast.success('Kupon silindi')
      loadCoupons()
    } catch {
      toast.error('Silme başarısız')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleDateString('tr-TR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kuponlar</h1>
          <p className="text-muted-foreground">İndirim kuponlarını yönetin</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Kupon
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Yeni Kupon Ekle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label>Kupon Kodu *</Label>
                  <Input
                    {...register('code')}
                    placeholder="YAZ2024"
                    className="uppercase"
                  />
                  {errors.code && (
                    <p className="text-xs text-red-500">{errors.code.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Tür *</Label>
                  <select
                    {...register('type')}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="PERCENTAGE">Yüzde (%)</option>
                    <option value="FIXED">Sabit Tutar (TL)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>Değer *</Label>
                  <Input
                    {...register('value')}
                    type="number"
                    step="0.01"
                    placeholder="10"
                  />
                  {errors.value && (
                    <p className="text-xs text-red-500">{errors.value.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Min. Sipariş Tutarı (TL)</Label>
                  <Input
                    {...register('minOrderAmount')}
                    type="number"
                    step="0.01"
                    placeholder="Opsiyonel"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Max. Kullanım Sayısı</Label>
                  <Input
                    {...register('maxUsageCount')}
                    type="number"
                    placeholder="Sınırsız"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    {...register('expiresAt')}
                    type="datetime-local"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Kupon Oluştur'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowForm(false); reset() }}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16 text-muted-foreground">
              Yükleniyor...
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Tag className="h-10 w-10 opacity-30" />
              <p>Henüz kupon eklenmemiş</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Kod</th>
                    <th className="px-4 py-3 text-left font-medium">Tür</th>
                    <th className="px-4 py-3 text-left font-medium">Değer</th>
                    <th className="px-4 py-3 text-left font-medium">Min. Tutar</th>
                    <th className="px-4 py-3 text-left font-medium">Kullanım</th>
                    <th className="px-4 py-3 text-left font-medium">Son Tarih</th>
                    <th className="px-4 py-3 text-left font-medium">Durum</th>
                    <th className="px-4 py-3 text-left font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600">
                        {coupon.code}
                      </td>
                      <td className="px-4 py-3">
                        {coupon.type === 'PERCENTAGE' ? 'Yüzde' : 'Sabit'}
                      </td>
                      <td className="px-4 py-3">
                        {coupon.type === 'PERCENTAGE'
                          ? `%${Number(coupon.value)}`
                          : `${Number(coupon.value)} TL`}
                      </td>
                      <td className="px-4 py-3">
                        {coupon.minOrderAmount ? `${Number(coupon.minOrderAmount)} TL` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {coupon.usedCount}
                        {coupon.maxUsageCount ? ` / ${coupon.maxUsageCount}` : ' / ∞'}
                      </td>
                      <td className="px-4 py-3">{formatDate(coupon.expiresAt)}</td>
                      <td className="px-4 py-3">
                        <Toggle
                          checked={coupon.isActive}
                          onChange={() => handleToggleActive(coupon)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          disabled={deletingId === coupon.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
