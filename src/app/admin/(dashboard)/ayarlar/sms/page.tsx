'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Settings {
  [key: string]: string
}

export default function SmsAyarlariPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        const map: Settings = {}
        if (data.settings) {
          for (const s of data.settings) {
            map[s.key] = s.value
          }
        }
        setSettings(map)
        setLoading(false)
      })
      .catch(() => {
        toast.error('Ayarlar yüklenemedi')
        setLoading(false)
      })
  }, [])

  function get(key: string, fallback = '') {
    return settings[key] ?? fallback
  }

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const keys = ['sms_username', 'sms_password', 'sms_originator']
      const payload: Settings = {}
      for (const k of keys) {
        payload[k] = get(k)
      }
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Kayıt başarısız')
      toast.success('SMS ayarları kaydedildi')
    } catch {
      toast.error('Kayıt başarısız')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16 text-muted-foreground">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SMS Ayarları</h1>
        <p className="text-muted-foreground">Netgsm SMS entegrasyon ayarları</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Netgsm API Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Kullanıcı Adı</Label>
              <Input
                value={get('sms_username')}
                onChange={(e) => set('sms_username', e.target.value)}
                placeholder="Netgsm kullanıcı adı"
              />
            </div>
            <div className="space-y-1">
              <Label>Şifre</Label>
              <Input
                type="password"
                value={get('sms_password')}
                onChange={(e) => set('sms_password', e.target.value)}
                placeholder="Netgsm şifresi"
              />
            </div>
            <div className="space-y-1">
              <Label>Başlık (Originator)</Label>
              <Input
                value={get('sms_originator')}
                onChange={(e) => set('sms_originator', e.target.value)}
                placeholder="SMS başlığı (maks 11 karakter)"
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">
                Netgsm panelinizde tanımlı başlık. Maks 11 karakter.
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Netgsm Hakkında</p>
            <p>
              SMS göndermek için Netgsm hesabı gereklidir. API bilgilerinizi{' '}
              <a
                href="https://www.netgsm.com.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                netgsm.com.tr
              </a>{' '}
              adresinden temin edebilirsiniz.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
