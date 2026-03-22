import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-[var(--market-footer-bg)] text-[var(--market-footer-text)]">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block text-2xl font-extrabold tracking-tight text-white">
              MARKET
            </Link>
            <p className="text-sm leading-relaxed opacity-80">
              Kaliteli ürünler, uygun fiyatlar. WhatsApp üzerinden kolay ve güvenli alışveriş deneyimi.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                aria-label="Facebook"
                className="flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <Instagram className="size-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <Twitter className="size-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Hızlı Linkler
            </h3>
            <nav className="flex flex-col gap-2.5">
              <Link href="/" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                Ana Sayfa
              </Link>
              <Link href="/urunler" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                Ürünler
              </Link>
              <Link href="/kategoriler" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                Kategoriler
              </Link>
              <Link href="/hakkimizda" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                Hakkımızda
              </Link>
              <Link href="/iletisim" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                İletişim
              </Link>
            </nav>
          </div>

          {/* Column 3: Customer Service */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Müşteri Hizmetleri
            </h3>
            <nav className="flex flex-col gap-2.5">
              <Link href="/sss" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                SSS
              </Link>
              <Link href="/kargo-bilgileri" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                Kargo Bilgileri
              </Link>
              <Link href="/iade-kosullari" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                İade Koşulları
              </Link>
              <Link href="/kvkk" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                KVKK
              </Link>
              <Link href="/gizlilik" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                Gizlilik Politikası
              </Link>
              <Link href="/kullanim-kosullari" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                Kullanım Koşulları
              </Link>
            </nav>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              İletişim
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 opacity-60" />
                <span className="text-sm opacity-80">
                  İstanbul, Türkiye
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 opacity-60" />
                <a href="tel:+905551234567" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                  +90 555 123 4567
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 opacity-60" />
                <a href="mailto:info@market.com" className="text-sm opacity-80 transition-opacity hover:opacity-100">
                  info@market.com
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 opacity-60" />
                <div className="text-sm opacity-80">
                  <p>Pazartesi - Cumartesi</p>
                  <p>09:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-4 text-center text-xs opacity-60 sm:flex-row sm:justify-between sm:text-left">
          <p>&copy; {new Date().getFullYear()} Market. Tüm hakları saklıdır.</p>
          <p>Ödemeler WhatsApp üzerinden IBAN ile yapılmaktadır.</p>
        </div>
      </div>
    </footer>
  )
}
