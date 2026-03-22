import { ArrowRight, MessageCircle, Shield, Truck, RotateCcw, Sparkles, ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { getCached } from "@/lib/cache"
import { HeroSlider } from "@/components/store/hero-slider"

async function getBanners() {
  return getCached("homeBanners", 60_000, async () => {
    const now = new Date()
    return db.banner.findMany({
      where: {
        status: true,
        position: "homepage",
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      orderBy: { sortOrder: "asc" },
    })
  }).catch(() => [])
}

async function getFeaturedProducts() {
  return getCached("featuredProducts", 60_000, async () => {
    const products = await db.product.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      take: 8,
      orderBy: { createdAt: "desc" },
    })
    return products
  }).catch(() => [])
}

async function getCategories() {
  return getCached("homeCategories", 60_000, async () => {
    const categories = await db.category.findMany({
      where: { status: true, parentId: null },
      take: 6,
      orderBy: { sortOrder: "asc" },
    })
    return categories
  }).catch(() => [])
}

export default async function HomePage() {
  const [banners, products, categories] = await Promise.all([getBanners(), getFeaturedProducts(), getCategories()])

  return (
    <div className="overflow-hidden" style={{ backgroundColor: '#0A0B0F' }}>

      {/* Hero */}
      {banners.length > 0 ? (
        <HeroSlider banners={banners} />
      ) : (
        <section className="relative min-h-[92vh] flex items-center" style={{ backgroundColor: '#070809' }}>
          {/* Background texture */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,102,0,0.08) 0%, transparent 60%)',
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,102,0,0.04) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />

          <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32 w-full">
            <div className="max-w-3xl">
              {/* Label */}
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-widest"
                style={{ backgroundColor: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.2)', color: 'var(--gold)' }}>
                <Sparkles className="size-3" />
                Yeni Sezon Koleksiyonu
              </div>

              {/* Heading */}
              <h1 className="mb-6 text-5xl font-light leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl"
                style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#F5F0E8' }}>
                Kaliteli Ürünler,
                <br />
                <span style={{ color: 'var(--gold)' }}>Kolay Alışveriş</span>
              </h1>

              {/* Divider */}
              <div className="mb-8 h-px w-24" style={{ backgroundColor: 'rgba(255,102,0,0.3)' }} />

              <p className="mb-10 max-w-lg text-lg leading-relaxed" style={{ color: '#6B6560' }}>
                Özenle seçilmiş ürün koleksiyonumuzu keşfedin. WhatsApp üzerinden tek mesajla siparişinizi tamamlayın.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/urunler"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.97]"
                  style={{ backgroundColor: 'var(--gold)', color: '#0A0B0F' }}
                >
                  Ürünleri Keşfet
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="https://wa.me/905551234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all hover:border-[rgba(37,211,102,0.3)] hover:text-[#25D366] active:scale-[0.97]"
                  style={{ border: '1px solid rgba(255,102,0,0.2)', color: '#9A9488', backgroundColor: 'transparent' }}
                >
                  <MessageCircle className="size-4" />
                  WhatsApp ile Sor
                </a>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to bottom, transparent, #0A0B0F)' }} />
        </section>
      )}

      {/* Trust badges */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 -mt-6 mb-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4"
          style={{ backgroundColor: 'rgba(255,102,0,0.1)', border: '1px solid rgba(255,102,0,0.1)' }}>
          {[
            { icon: MessageCircle, label: "WhatsApp Destek", sub: "7/24 Canlı", accent: '#25D366' },
            { icon: Shield, label: "Güvenli Ödeme", sub: "Havale / EFT", accent: 'var(--gold)' },
            { icon: Truck, label: "Hızlı Kargo", sub: "1-3 İş Günü", accent: '#60A5FA' },
            { icon: RotateCcw, label: "Kolay İade", sub: "14 Gün İçinde", accent: '#A78BFA' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-5 py-5" style={{ backgroundColor: '#0D0F14' }}>
              <item.icon className="size-5 shrink-0" style={{ color: item.accent }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F5F0E8' }}>{item.label}</p>
                <p className="text-xs" style={{ color: '#4A4640' }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--gold)' }}>
              — Koleksiyon
            </p>
            <h2 className="text-4xl font-light tracking-tight sm:text-5xl" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#F5F0E8' }}>
              Öne Çıkan Ürünler
            </h2>
          </div>
          <Link href="/urunler" className="group hidden items-center gap-1.5 text-sm font-medium uppercase tracking-wider transition-colors hover:text-[var(--gold)] sm:inline-flex"
            style={{ color: '#6B6560' }}
          >
            Tümünü Gör
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p: any) => (
              <Link key={p.id} href={`/urun/${p.slug}`} className="group">
                <div className="overflow-hidden rounded-2xl bg-[#12141A] border border-[rgba(255,102,0,0.12)] transition-all duration-300 hover:border-[rgba(255,102,0,0.32)] hover:shadow-[0_8px_40px_rgba(255,102,0,0.07)]">
                  <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: '#1A1D27' }}>
                    {p.images?.[0]?.url ? (
                      <Image
                        src={p.images[0].url}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="size-12" style={{ color: '#2A2A35' }} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ backgroundColor: 'rgba(10,11,15,0.3)' }}>
                      <span className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                        style={{ backgroundColor: 'rgba(255,102,0,0.9)', color: '#0A0B0F' }}>
                        İncele
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:opacity-80"
                      style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#D4CFC8', fontSize: '0.95rem' }}>
                      {p.name}
                    </h3>
                    <p className="text-2xl font-semibold leading-none" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: 'var(--gold)' }}>
                      {Number(p.priceTl).toFixed(2)} ₺
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl" style={{ backgroundColor: '#12141A', border: '1px solid rgba(255,102,0,0.08)' }}>
                <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: '#1A1D27' }}>
                  <div className="text-center">
                    <div className="mx-auto mb-3 size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,102,0,0.08)' }}>
                      <ShoppingBag className="size-6" style={{ color: 'rgba(255,102,0,0.3)' }} />
                    </div>
                    <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#2A2620' }}>Yakında</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2 h-4 w-2/3 rounded" style={{ backgroundColor: '#1A1D27' }} />
                  <div className="h-6 w-1/3 rounded" style={{ backgroundColor: '#1A1D27' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/urunler" className="inline-flex items-center gap-1.5 text-sm font-medium uppercase tracking-wider text-[var(--gold)]">
            Tümünü Gör <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-20" style={{ backgroundColor: '#070809', borderTop: '1px solid rgba(255,102,0,0.06)', borderBottom: '1px solid rgba(255,102,0,0.06)' }}>
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--gold)' }}>— Keşfet</p>
              <h2 className="text-4xl font-light tracking-tight sm:text-5xl" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#F5F0E8' }}>
                Kategoriler
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat: any, i: number) => (
                <Link
                  key={cat.id}
                  href={`/kategori/${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 bg-[#0D0F14] border border-[rgba(255,102,0,0.1)] hover:border-[rgba(255,102,0,0.28)] hover:bg-[#10121A]"
                >
                  {/* Category number */}
                  <span className="absolute right-8 top-8 text-6xl font-bold opacity-[0.04]" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: 'var(--gold)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(255,102,0,0.08)', border: '1px solid rgba(255,102,0,0.15)' }}>
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: 'var(--gold)' }} />
                  </div>

                  <h3 className="mb-1 text-xl font-semibold" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#F5F0E8' }}>
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-sm line-clamp-2" style={{ color: '#4A4640' }}>{cat.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl px-8 py-20 text-center sm:px-16"
          style={{ backgroundColor: '#0D120E', border: '1px solid rgba(37,211,102,0.15)' }}>
          {/* Glow */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(37,211,102,0.06) 0%, transparent 60%)' }} />

          <div className="relative">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)' }}>
              <MessageCircle className="size-7" style={{ color: '#25D366' }} />
            </div>

            <h2 className="mb-4 text-4xl font-light tracking-tight sm:text-5xl" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#F5F0E8' }}>
              Sorularınız mı var?
            </h2>
            <div className="mx-auto mb-8 h-px w-16" style={{ backgroundColor: 'rgba(37,211,102,0.3)' }} />
            <p className="mx-auto mb-10 max-w-md text-base leading-relaxed" style={{ color: '#4A5A4A' }}>
              WhatsApp üzerinden bize ulaşın, ürünler hakkında detaylı bilgi alın ve siparişinizi kolayca oluşturun.
            </p>
            <a
              href="https://wa.me/905551234567"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-xl px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: '#25D366', color: '#0A0B0F' }}
            >
              <MessageCircle className="size-5" />
              WhatsApp&apos;tan Yazın
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
