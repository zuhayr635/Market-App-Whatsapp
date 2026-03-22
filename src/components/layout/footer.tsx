import { Phone, Mail, MapPin, Clock } from "lucide-react"
import Link from "next/link"

export function Footer({ siteName = "MARKET" }: { siteName?: string }) {
  return (
    <footer className="bg-stone-950 text-stone-400">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8">
        {/* Main grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="inline-block text-2xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-heading), serif' }}>
              {siteName}
            </Link>
            <p className="text-sm leading-relaxed">
              Kaliteli urunler, uygun fiyatlar. WhatsApp uzerinden kolay ve guvenli alisveris.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Magaza</h3>
            <nav className="flex flex-col gap-2.5">
              {[
                { href: "/", label: "Ana Sayfa" },
                { href: "/urunler", label: "Urunler" },
                { href: "/iletisim", label: "Iletisim" },
                { href: "/sss", label: "SSS" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="text-sm transition-colors hover:text-white">{item.label}</Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Yasal</h3>
            <nav className="flex flex-col gap-2.5">
              {[
                { href: "/kvkk", label: "KVKK" },
                { href: "/gizlilik", label: "Gizlilik Politikasi" },
                { href: "/kullanim-kosullari", label: "Kullanim Kosullari" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="text-sm transition-colors hover:text-white">{item.label}</Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Iletisim</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-stone-600" />
                <span className="text-sm">Istanbul, Turkiye</span>
              </div>
              <a href="tel:+905551234567" className="flex items-center gap-3 text-sm transition-colors hover:text-white">
                <Phone className="size-4 shrink-0 text-stone-600" />
                +90 555 123 4567
              </a>
              <a href="mailto:info@market.com" className="flex items-center gap-3 text-sm transition-colors hover:text-white">
                <Mail className="size-4 shrink-0 text-stone-600" />
                info@market.com
              </a>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-stone-600" />
                <div className="text-sm">
                  <p>Pzt - Cmt: 09:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-stone-800 pt-8 text-center text-xs text-stone-600 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Market. Tum haklari saklidir.</p>
          <p>Odemeler havale/EFT ile yapilmaktadir</p>
        </div>
      </div>
    </footer>
  )
}
