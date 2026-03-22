import { db } from "@/lib/db"

const templates = [
  {
    name: "kayit_basarili",
    subject: "Hoş Geldiniz! Kaydınız Tamamlandı",
    content: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#2563eb;">Hoş Geldiniz, {ad_soyad}!</h2>
  <p>Market platformumuza kaydolduğunuz için teşekkür ederiz.</p>
  <p>Hesabınız başarıyla oluşturuldu. Artık alışverişe başlayabilirsiniz.</p>
  <p>E-posta adresiniz: <strong>{email}</strong></p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="color:#666;font-size:12px;">Bu e-postayı siz istediniz. Eğer siz göndermediyseniz lütfen bizimle iletişime geçin.</p>
</div>
</body>
</html>`,
    variables: JSON.stringify(["ad_soyad", "email"]),
  },
  {
    name: "email_dogrulama",
    subject: "E-posta Adresinizi Doğrulayın",
    content: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#2563eb;">E-posta Doğrulama</h2>
  <p>Merhaba {ad_soyad},</p>
  <p>E-posta adresinizi doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
  <a href="{dogrulama_linki}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">E-postamı Doğrula</a>
  <p>Bu bağlantı 24 saat geçerlidir.</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
  <p style="color:#666;font-size:12px;">Bu e-postayı siz istediniz.</p>
</div>
</body>
</html>`,
    variables: JSON.stringify(["ad_soyad", "dogrulama_linki"]),
  },
  {
    name: "sifre_sifirla",
    subject: "Şifre Sıfırlama Talebi",
    content: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#dc2626;">Şifre Sıfırlama</h2>
  <p>Merhaba {ad_soyad},</p>
  <p>Şifre sıfırlama talebinizi aldık. Yeni şifre oluşturmak için aşağıdaki bağlantıya tıklayın:</p>
  <a href="{sifre_sifirla_linki}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">Şifremi Sıfırla</a>
  <p>Bu bağlantı 1 saat geçerlidir.</p>
  <p>Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
</div>
</body>
</html>`,
    variables: JSON.stringify(["ad_soyad", "sifre_sifirla_linki"]),
  },
  {
    name: "siparis_olusturuldu",
    subject: "Siparişiniz Alındı - #{siparis_no}",
    content: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#16a34a;">Siparişiniz Alındı!</h2>
  <p>Merhaba {ad_soyad},</p>
  <p>Siparişiniz başarıyla oluşturuldu.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Sipariş No:</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">#{siparis_no}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Toplam (USD):</td><td style="padding:8px;border-bottom:1px solid #eee;">{toplam_usd}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Toplam (TL):</td><td style="padding:8px;border-bottom:1px solid #eee;">{toplam_tl}</td></tr>
    <tr><td style="padding:8px;color:#666;">Durum:</td><td style="padding:8px;">Beklemede</td></tr>
  </table>
  <p>Ödeme dekontunuzu yükledikten sonra siparişiniz işleme alınacaktır.</p>
  <a href="{siparis_linki}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">Siparişi Görüntüle</a>
</div>
</body>
</html>`,
    variables: JSON.stringify(["ad_soyad", "siparis_no", "toplam_usd", "toplam_tl", "siparis_linki"]),
  },
  {
    name: "siparis_durumu_degisti",
    subject: "Sipariş Durumunuz Güncellendi - #{siparis_no}",
    content: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#2563eb;">Sipariş Durumu Güncellendi</h2>
  <p>Merhaba {ad_soyad},</p>
  <p>#{siparis_no} numaralı siparişinizin durumu güncellendi.</p>
  <p style="font-size:18px;">Yeni Durum: <strong>{yeni_durum}</strong></p>
  <p>{aciklama}</p>
  <a href="{siparis_linki}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">Siparişi Görüntüle</a>
</div>
</body>
</html>`,
    variables: JSON.stringify(["ad_soyad", "siparis_no", "yeni_durum", "aciklama", "siparis_linki"]),
  },
  {
    name: "dekont_onaylandi",
    subject: "Ödemeniz Onaylandı - #{siparis_no}",
    content: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#16a34a;">Ödemeniz Onaylandı!</h2>
  <p>Merhaba {ad_soyad},</p>
  <p>#{siparis_no} numaralı siparişiniz için yüklediğiniz ödeme dekontu onaylandı.</p>
  <p>Siparişiniz en kısa sürede hazırlanarak kargoya verilecektir.</p>
  <a href="{siparis_linki}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">Siparişi Görüntüle</a>
</div>
</body>
</html>`,
    variables: JSON.stringify(["ad_soyad", "siparis_no", "siparis_linki"]),
  },
  {
    name: "dekont_reddedildi",
    subject: "Ödeme Dekontunuz Reddedildi - #{siparis_no}",
    content: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#dc2626;">Dekont Reddedildi</h2>
  <p>Merhaba {ad_soyad},</p>
  <p>#{siparis_no} numaralı siparişiniz için yüklediğiniz ödeme dekontu reddedildi.</p>
  <p><strong>Red Sebebi:</strong> {red_sebebi}</p>
  <p>Lütfen geçerli bir dekont yükleyiniz.</p>
  <a href="{siparis_linki}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">Siparişe Git</a>
</div>
</body>
</html>`,
    variables: JSON.stringify(["ad_soyad", "siparis_no", "red_sebebi", "siparis_linki"]),
  },
  {
    name: "kargoya_verildi",
    subject: "Siparişiniz Kargoya Verildi - #{siparis_no}",
    content: `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
  <h2 style="color:#2563eb;">Siparişiniz Kargoya Verildi!</h2>
  <p>Merhaba {ad_soyad},</p>
  <p>#{siparis_no} numaralı siparişiniz kargoya verildi.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Kargo Firması:</td><td style="padding:8px;border-bottom:1px solid #eee;">{kargo_firmasi}</td></tr>
    <tr><td style="padding:8px;color:#666;">Takip No:</td><td style="padding:8px;font-weight:bold;">{takip_no}</td></tr>
  </table>
  <a href="{siparis_linki}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin:16px 0;">Siparişi Takip Et</a>
</div>
</body>
</html>`,
    variables: JSON.stringify(["ad_soyad", "siparis_no", "kargo_firmasi", "takip_no", "siparis_linki"]),
  },
]

export async function seedEmailTemplates() {
  for (const tpl of templates) {
    const existing = await db.emailTemplate.findUnique({ where: { name: tpl.name } })
    if (!existing) {
      await db.emailTemplate.create({ data: tpl })
    }
  }
}
