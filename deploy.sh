#!/bin/bash
set -e

echo "Market App Deploy Basliyor..."

# .env dosyasi yoksa .env.example'dan kopyala
if [ ! -f .env ]; then
  echo "UYARI: .env dosyasi bulunamadi, .env.example'dan kopyalaniyor..."
  cp .env.example .env
  echo "TAMAM: .env olusturuldu. Lutfen degerleri duzenleyin."
  exit 1
fi

# Docker build ve baslat
echo "Docker image build ediliyor..."
docker-compose build --no-cache

echo "Servisler baslatiliyor..."
docker-compose up -d

echo "Uygulama hazir olana kadar bekleniyor..."
sleep 10

# Health check
for i in {1..12}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "TAMAM: Uygulama hazir! http://localhost:3000"
    break
  fi
  echo "Bekleniyor... ($i/12)"
  sleep 5
done

echo ""
echo "Container durumu:"
docker-compose ps

echo ""
echo "Kullanisli komutlar:"
echo "  Loglar:    docker-compose logs -f app"
echo "  Durdur:    docker-compose down"
echo "  Yeniden:   docker-compose restart app"
