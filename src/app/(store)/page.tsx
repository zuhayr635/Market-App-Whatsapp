import { ArrowRight, MessageCircle, Shield, Truck, RotateCcw, Sparkles, Star, ShoppingBag } from "lucide-react"
import Link from "next/link"
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
    <div className="overflow-hidden">
      {/* Hero — Banner slider or static fallback */}
      {banners.length > 0 ? (
        <HeroSlider banners={banners} />
      ) : (
        <section className="relative bg-stone-950">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-stone-950" />
          <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:py-40">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-600/10 px-4 py-1.5 text-sm text-amber-400">
                <Sparkles className="size-3.5" />
                Yeni sezon ürünleri keşfedin
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-heading), serif' }}>
                Kaliteli Ürünler,{" "}
                <span className="text-amber-500">Kolay Alışveriş</span>
              </h1>
              <p className="mb-10 max-w-lg text-lg leading-relaxed text-stone-400">
                Özenle seçilmiş ürün koleksiyonumuzu keşfedin. WhatsApp üzerinden tek mesajla siparişinizi tamamlayın.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/urunler"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-amber-600/25 transition-all hover:bg-amber-700 hover:shadow-xl hover:shadow-amber-600/30 active:scale-[0.98]"
                >
                  Ürünleri Keşfet
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="https://wa.me/905551234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-[0.98]"
                >
                  <MessageCircle className="size-4 text-green-400" />
                  WhatsApp ile Sor
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust badges - floating bar */}
      <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#E7E0D8] bg-white p-4 shadow-xl shadow-stone-200/50 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-[#E7E0D8] sm:p-0">
          {[
            { icon: MessageCircle, label: "WhatsApp Destek", sub: "7/24 Canlı", color: "text-green-600" },
            { icon: Shield, label: "Güvenli Ödeme", sub: "Havale / EFT", color: "text-amber-600" },
            { icon: Truck, label: "Hızlı Kargo", sub: "1-3 İş Günü", color: "text-blue-600" },
            { icon: RotateCcw, label: "Kolay İade", sub: "14 Gün İçinde", color: "text-purple-600" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-4 sm:justify-center sm:py-5">
              <div className={`flex size-10 items-center justify-center rounded-xl bg-stone-50 ${item.color}`}>
                <item.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">{item.label}</p>
                <p className="text-xs text-stone-500">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-amber-700">Koleksiyon</p>
            <h2 className="text-3xl font-bold text-stone-900 sm:text-4xl" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Öne Çıkan Ürünler
            </h2>
          </div>
          <Link href="/urunler" className="group hidden items-center gap-1 text-sm font-medium text-amber-700 transition-colors hover:text-amber-800 sm:inline-flex">
            Tümünü Gör
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p: any) => (
              <Link key={p.id} href={`/urun/${p.slug}`} className="group">
                <div className="overflow-hidden rounded-2xl border border-[#E7E0D8] bg-white transition-all duration-300 hover:shadow-lg hover:shadow-stone-200/50">
                  <div className="aspect-square overflow-hidden bg-stone-100">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-300">
                        <ShoppingBag className="size-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 text-sm font-medium text-stone-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-lg font-bold text-amber-700">
                      ${Number(p.priceUsd).toFixed(2)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-[#E7E0D8] bg-white">
                <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
                  <div className="text-center">
                    <Star className="mx-auto mb-2 size-8 text-amber-300" />
                    <p className="text-sm text-stone-400">Yakında</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2 h-4 w-2/3 rounded bg-stone-100" />
                  <div className="h-5 w-1/3 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/urunler" className="inline-flex items-center gap-1 text-sm font-medium text-amber-700">
            Tümünü Gör <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-stone-950 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-amber-500">Keşfet</p>
              <h2 className="text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: 'var(--font-heading), serif' }}>
                Kategoriler
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/kategori/${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-stone-900 p-8 transition-all hover:bg-stone-800"
                >
                  <div className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-amber-600/10 text-amber-500 transition-colors group-hover:bg-amber-600/20">
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading), serif' }}>{cat.name}</h3>
                  {cat.description && (
                    <p className="mt-2 text-sm text-stone-400 line-clamp-2">{cat.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA WhatsApp Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-800 to-green-900 px-8 py-16 text-center sm:px-16">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="relative">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <MessageCircle className="size-8 text-green-300" />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: 'var(--font-heading), serif' }}>
              Sorularınız mı var?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-green-200">
              WhatsApp üzerinden bize ulaşın, ürünler hakkında detaylı bilgi alalım ve siparişinizi kolayca oluşturalım.
            </p>
            <a
              href="https://wa.me/905551234567"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-semibold text-green-800 shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
            >
              <MessageCircle className="size-5" />
              WhatsApp'tan Yazın
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
