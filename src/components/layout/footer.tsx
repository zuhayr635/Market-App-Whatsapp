"use client"

import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react"
import Link from "next/link"

export function Footer({ siteName = "MARKET", whatsappNumber = "", contactPhone = "" }: { siteName?: string; whatsappNumber?: string; contactPhone?: string }) {
  const wpNum = whatsappNumber.replace(/\D/g, "")
  const waHref = wpNum ? `https://wa.me/${wpNum}` : "#"
  const phoneDisplay = contactPhone || whatsappNumber || ""
  const telHref = phoneDisplay ? `tel:${phoneDisplay.replace(/\s/g, "")}` : "#"
  return (
    <footer style={{ backgroundColor: '#060709', borderTop: '1px solid rgba(255,102,0,0.1)' }}>
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        {/* Main grid */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold tracking-[0.08em]" style={{ color: 'var(--market-primary)' }}>
                {siteName}
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#4A4640' }}>
              Kaliteli ürünler, uygun fiyatlar. WhatsApp üzerinden kolay ve güvenli alışveriş.
            </p>
            {wpNum && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: '#1A2E1F', color: '#25D366', border: '1px solid rgba(37,211,102,0.2)' }}
              >
                <MessageCircle className="size-4" />
                WhatsApp ile Ulaşın
              </a>
            )}
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--market-primary)' }}>
              Mağaza
            </h3>
            <nav className="flex flex-col gap-3">
              {[
                { href: "/", label: "Ana Sayfa" },
                { href: "/urunler", label: "Ürünler" },
                { href: "/iletisim", label: "İletişim" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-bold transition-colors"
                  style={{ color: '#4A4640' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'var(--market-primary)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#4A4640')}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--market-primary)' }}>
              Yasal
            </h3>
            <nav className="flex flex-col gap-3">
              {[
                { href: "/kvkk", label: "KVKK" },
                { href: "/gizlilik", label: "Gizlilik Politikası" },
                { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
                { href: "/iade-kosullari", label: "İade Koşulları" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm transition-colors"
                  style={{ color: '#4A4640' }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'var(--market-primary)')}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = '#4A4640')}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--market-primary)' }}>
              İletişim
            </h3>
            <div className="flex flex-col gap-3.5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: '#4A4640' }} />
                <span className="text-sm" style={{ color: '#4A4640' }}>İstanbul, Türkiye</span>
              </div>
              {phoneDisplay && (
                <a href={telHref} className="flex items-center gap-3 text-sm transition-colors" style={{ color: '#4A4640' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--market-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4A4640')}
                >
                  <Phone className="size-4 shrink-0" style={{ color: '#4A4640' }} />
                  {phoneDisplay}
                </a>
              )}
              <a href="mailto:info@market.com" className="flex items-center gap-3 text-sm transition-colors" style={{ color: '#4A4640' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--market-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4A4640')}
              >
                <Mail className="size-4 shrink-0" style={{ color: '#4A4640' }} />
                info@market.com
              </a>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0" style={{ color: '#4A4640' }} />
                <p className="text-sm" style={{ color: '#4A4640' }}>Pzt – Cmt: 09:00 – 18:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-14 h-px" style={{ backgroundColor: 'rgba(255,102,0,0.08)' }} />

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center gap-3 text-center text-xs sm:flex-row sm:justify-between">
          <p style={{ color: '#2A2620' }}>© {new Date().getFullYear()} {siteName}. Tüm hakları saklıdır.</p>
          <p style={{ color: '#2A2620' }}>Ödemeler havale/EFT ile yapılmaktadır</p>
        </div>
      </div>
    </footer>
  )
}
