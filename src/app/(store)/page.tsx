import { MessageCircle, Shield, Truck, RotateCcw, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:py-28">
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Hoş Geldiniz</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">
            Kaliteli ürünleri uygun fiyatlarla keşfedin. Siparişlerinizi WhatsApp üzerinden kolayca tamamlayın.
          </p>
          <Link href="/urunler" className="inline-flex items-center justify-center bg-white text-blue-700 hover:bg-blue-50 text-lg px-8 py-3 rounded-xl font-medium transition-colors">
            Ürünleri Keşfet <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Featured Products Placeholder */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Öne Çıkan Ürünler</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex h-72 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
              Yakında...
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">Neden Bizi Tercih Etmelisiniz?</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MessageCircle, title: "WhatsApp Destek", desc: "7/24 WhatsApp üzerinden destek alın", color: "text-green-500 bg-green-50" },
              { icon: Shield, title: "Güvenli Ödeme", desc: "IBAN ile güvenli ödeme imkanı", color: "text-blue-500 bg-blue-50" },
              { icon: Truck, title: "Hızlı Kargo", desc: "Siparişleriniz hızlıca kapınızda", color: "text-orange-500 bg-orange-50" },
              { icon: RotateCcw, title: "Kolay İade", desc: "Sorunsuz iade ve değişim", color: "text-purple-500 bg-purple-50" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white p-6 text-center shadow-sm">
                <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${item.color}`}>
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Placeholder */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Kategoriler</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
              Yakında...
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
