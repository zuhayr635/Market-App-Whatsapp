"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Settings {
  [key: string]: string
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

export default function AyarlarGenelPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/settings")
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
  }, [])

  function get(key: string, fallback = "") {
    return settings[key] ?? fallback
  }

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  function getBool(key: string) {
    return get(key) === "true"
  }

  function setBool(key: string, value: boolean) {
    set(key, value ? "true" : "false")
  }

  async function saveGroup(keys: string[]) {
    setSaving(keys[0])
    const payload: Settings = {}
    for (const k of keys) {
      payload[k] = get(k)
    }
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaving(null)
  }

  if (loading) {
    return <div className="flex justify-center py-16 text-muted-foreground">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Site Ayarları</h1>
        <p className="text-muted-foreground">Platform geneli ayarları yönetin</p>
      </div>

      <Tabs defaultValue="genel">
        <TabsList className="mb-6">
          <TabsTrigger value="genel">Genel</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="urun">Ürün</TabsTrigger>
          <TabsTrigger value="eposta">E-posta</TabsTrigger>
        </TabsList>

        {/* Tab 1: Genel */}
        <TabsContent value="genel">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Site Adı</Label>
                  <Input value={get("site_name")} onChange={(e) => set("site_name", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Site Açıklaması</Label>
                  <Input value={get("site_description")} onChange={(e) => set("site_description", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Logo URL</Label>
                  <Input value={get("logo_url")} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <Label>Favicon URL</Label>
                  <Input value={get("favicon_url")} onChange={(e) => set("favicon_url", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <Label>Telefon</Label>
                  <Input value={get("contact_phone")} onChange={(e) => set("contact_phone", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>E-posta</Label>
                  <Input value={get("contact_email")} onChange={(e) => set("contact_email", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Adres</Label>
                <Textarea
                  value={get("contact_address")}
                  onChange={(e) => set("contact_address", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <Label>Google Analytics Kodu</Label>
                <Input value={get("ga_code")} onChange={(e) => set("ga_code", e.target.value)} placeholder="G-XXXXXXXXXX" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Bakım Modu</p>
                  <p className="text-sm text-muted-foreground">Açıkken ziyaretçiler bakım sayfası görür</p>
                </div>
                <Toggle checked={getBool("maintenance_mode")} onChange={(v) => setBool("maintenance_mode", v)} />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    saveGroup(["site_name", "site_description", "logo_url", "favicon_url", "contact_phone", "contact_email", "contact_address", "ga_code", "maintenance_mode"])
                  }
                  disabled={saving !== null}
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: WhatsApp */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>WhatsApp Numarası</Label>
                <Input
                  value={get("whatsapp_number")}
                  onChange={(e) => set("whatsapp_number", e.target.value)}
                  placeholder="905xxxxxxxxx"
                />
              </div>
              <div className="space-y-1">
                <Label>Mesaj Şablonu</Label>
                <Textarea
                  value={get("whatsapp_template")}
                  onChange={(e) => set("whatsapp_template", e.target.value)}
                  rows={5}
                  placeholder="Merhaba, {siparis_no} nolu siparişim hakkında bilgi almak istiyorum. Müşteri: {musteri_adi}"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Değişkenler: {"{siparis_no}"}, {"{musteri_adi}"}, {"{urun_adi}"}, {"{toplam}"}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Floating Buton</p>
                  <p className="text-sm text-muted-foreground">Sayfada WhatsApp butonunu göster</p>
                </div>
                <Toggle
                  checked={getBool("whatsapp_float_enabled")}
                  onChange={(v) => setBool("whatsapp_float_enabled", v)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => saveGroup(["whatsapp_number", "whatsapp_template", "whatsapp_float_enabled"])}
                  disabled={saving !== null}
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Ürün */}
        <TabsContent value="urun">
          <Card>
            <CardHeader>
              <CardTitle>Ürün Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Misafir Fiyat Görünümü</p>
                  <p className="text-sm text-muted-foreground">Giriş yapmamış kullanıcılar fiyatı görsün</p>
                </div>
                <Toggle
                  checked={getBool("guest_price_visible")}
                  onChange={(v) => setBool("guest_price_visible", v)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Stokta Olmayan Ürünleri Göster</p>
                  <p className="text-sm text-muted-foreground">Stok sıfır olan ürünler listede görünsün</p>
                </div>
                <Toggle
                  checked={getBool("show_out_of_stock")}
                  onChange={(v) => setBool("show_out_of_stock", v)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Yeni Ürün Etiketi Süresi (gün)</Label>
                  <Input
                    type="number"
                    value={get("new_product_days", "30")}
                    onChange={(e) => set("new_product_days", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Düşük Stok Eşiği</Label>
                  <Input
                    type="number"
                    value={get("low_stock_threshold", "5")}
                    onChange={(e) => set("low_stock_threshold", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => saveGroup(["guest_price_visible", "show_out_of_stock", "new_product_days", "low_stock_threshold"])}
                  disabled={saving !== null}
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: E-posta */}
        <TabsContent value="eposta">
          <Card>
            <CardHeader>
              <CardTitle>E-posta Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>SMTP Host</Label>
                  <Input
                    value={get("smtp_host")}
                    onChange={(e) => set("smtp_host", e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label>SMTP Port</Label>
                  <Input
                    type="number"
                    value={get("smtp_port", "587")}
                    onChange={(e) => set("smtp_port", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>SMTP Kullanıcı</Label>
                  <Input value={get("smtp_user")} onChange={(e) => set("smtp_user", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>SMTP Şifre</Label>
                  <Input
                    type="password"
                    value={get("smtp_pass")}
                    onChange={(e) => set("smtp_pass", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Gönderici Adı</Label>
                  <Input value={get("mail_from_name")} onChange={(e) => set("mail_from_name", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Gönderici E-posta</Label>
                  <Input value={get("mail_from_email")} onChange={(e) => set("mail_from_email", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">E-posta Doğrulama Zorunlu</p>
                  <p className="text-sm text-muted-foreground">Kayıt sonrası e-posta doğrulaması gereksin</p>
                </div>
                <Toggle
                  checked={getBool("email_verification_required")}
                  onChange={(v) => setBool("email_verification_required", v)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    saveGroup(["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "mail_from_name", "mail_from_email", "email_verification_required"])
                  }
                  disabled={saving !== null}
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

