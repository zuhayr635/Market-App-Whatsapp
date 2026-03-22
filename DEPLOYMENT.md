# Deployment Kilavuzu

## Hizli Baslangic

1. `.env` dosyasini olustur:
   ```bash
   cp .env.example .env
   # .env'yi duzenle
   ```

2. Docker ile baslat:
   ```bash
   docker-compose up -d
   ```

3. Kontrol et:
   ```bash
   curl http://localhost:3000/api/health
   ```

## Ortam Degiskenleri

| Degisken | Aciklama | Ornek |
|----------|----------|-------|
| `DATABASE_URL` | MySQL baglanti URL | `mysql://root:pass@db:3306/market_db` |
| `NEXTAUTH_SECRET` | Rastgele guclu string (32+ karakter) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Uygulamanin tam URL'i | `https://yourdomain.com` |
| `NEXT_PUBLIC_BASE_URL` | Sitemap/SEO icin base URL | `https://yourdomain.com` |

## Admin Girisi (Ilk Kurulum)

Varsayilan admin: `admin@market.com` / `Admin123!`

**ONEMLI:** Ilk giristten sonra sifreyi degistir!

## Komutlar

```bash
# Baslat
docker-compose up -d

# Loglar
docker-compose logs -f app

# Durdur
docker-compose down

# Veritabanini sil (dikkat!)
docker-compose down -v
```

## Nginx ile HTTPS (Opsiyonel)

Nginx reverse proxy icin ornek config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
