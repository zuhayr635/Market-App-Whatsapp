# cihanekspress.com — Coolify Deploy Rehberi

## Gereksinimler
- Bir VPS (min 2 GB RAM, Ubuntu 22.04 önerilir)
- Coolify kurulu (https://coolify.io/docs/installation)
- GitHub hesabı + bu repo push edilmiş
- cihanekspress.com domaini, VPS IP'sine yönlendirilmiş (A kaydı)

---

## Adım 1 — GitHub'a Push Et

```bash
cd market-app
git init                          # eğer henüz git yoksa
git remote add origin https://github.com/KULLANICI/market-app.git
git add .
git commit -m "initial deploy"
git push -u origin main
```

---

## Adım 2 — Coolify'da Yeni Proje Oluştur

1. Coolify arayüzüne gir → **New Resource** → **Docker Compose**
2. **Source:** GitHub'dan repoyu seç (`market-app`)
3. **Branch:** `main`
4. **Docker Compose file path:** `docker-compose.yml`
5. **Build pack:** `Docker Compose`

---

## Adım 3 — Environment Variables Ayarla

Coolify → Proje → **Environment Variables** bölümüne şunları ekle:

| Değişken | Değer |
|----------|-------|
| `DB_PASSWORD` | Güçlü bir şifre (en az 20 karakter) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` çıktısı |
| `NEXTAUTH_URL` | `https://cihanekspress.com` |
| `NEXT_PUBLIC_BASE_URL` | `https://cihanekspress.com` |
| `APP_PORT` | `3000` |

> **NEXTAUTH_SECRET üretmek için:**
> ```bash
> openssl rand -base64 32
> ```

---

## Adım 4 — Domain Ayarla

Coolify → Proje → **Domains** bölümüne:
- Domain: `cihanekspress.com`
- Port: `3000`
- SSL: **Let's Encrypt** (otomatik)

---

## Adım 5 — Deploy Et

**Deploy** butonuna bas. İlk build ~3-5 dakika sürer.

Build tamamlanınca:
- `https://cihanekspress.com` siteni açar
- `https://cihanekspress.com/admin` admin panelini açar

---

## İlk Giriş

| | |
|--|--|
| **URL** | `https://cihanekspress.com/admin` |
| **E-posta** | `admin@market.com` |
| **Şifre** | `Admin123!` |

> ⚠️ İlk girişten hemen sonra şifreyi değiştir!

---

## Sonraki Deploylar (Otomatik)

Coolify → **Settings** → **Webhooks** → GitHub webhook ekle.

Bundan sonra `git push origin main` yaptığında Coolify otomatik deploy eder.

Ya da Coolify üzerinden **Redeploy** butonuna basabilirsin.

---

## Faydalı Komutlar

```bash
# Logları izle (Coolify terminali)
docker-compose logs -f app

# Uygulamayı yeniden başlat
docker-compose restart app

# Veritabanı yedeği al
docker exec $(docker ps -qf name=db) mysqldump -uroot -p$DB_PASSWORD market_db > yedek.sql

# Yedeği geri yükle
docker exec -i $(docker ps -qf name=db) mysql -uroot -p$DB_PASSWORD market_db < yedek.sql
```

---

## Sorun Giderme

### Site açılmıyor
```bash
docker-compose logs app --tail=50
```

### DB bağlantı hatası
- `DB_PASSWORD` değişkeninin doğru ayarlandığını kontrol et
- DB container'ın sağlıklı olduğunu kontrol et: `docker-compose ps`

### Yavaşlık
- VPS RAM kontrolü: `free -h` (en az 1 GB boş olmalı)
- DB yavaşsa: Admin panel → Ayarlar → Döviz Kuru güncelle (cache temizler)

---

## Mimari

```
cihanekspress.com
       │
  Coolify Proxy (SSL/HTTPS)
       │
  app:3000 (Next.js standalone)
       │
  db:3306 (MySQL 8.0)
       │
  Persistent Volumes:
    - mysql_data  → veritabanı
    - uploads_data → /app/public/uploads
```
