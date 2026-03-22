import { MessageCircle, Shield, Truck, Heart } from "lucide-react"
import { Metadata } from "next"
import { db } from "@/lib/db"

export async function generateMetadata(): Promise<Metadata> {
  const page = await db.page.findUnique({ where: { slug: "hakkimizda" } })
  return {
    title: page?.seoTitle || "Hakkımızda",
    description: page?.seoDesc || "Hakkımızda ve hikayemiz",
  }
}

export default async function HakkimizdaPage() {
  const page = await db.page.findUnique({ where: { slug: "hakkimizda" } })
  const hasDbContent = page && page.content && page.content.trim().length > 0

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading), serif' }}>
        {page?.title || "Hakkımızda"}
      </h1>

      {hasDbContent ? (
        <div
          className="space-y-6 text-stone-600 leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <>
          <div className="space-y-6 text-stone-600 leading-relaxed">
            <p>
              Market olarak, kaliteli ürünleri uygun fiyatlarla sizlere sunmayı amaçlıyoruz.
              Müşteri memnuniyetini ön planda tutarak, güvenilir ve hızlı bir alışveriş deneyimi sağlıyoruz.
            </p>
            <p>
              WhatsApp üzerinden kolay sipariş sistemiyle, alışverişi herkes için erişilebilir hale getiriyoruz.
              Havale/EFT ile güvenli ödeme imkanı sunuyor, siparişlerinizi hızlıca kapınıza ulaştırıyoruz.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Heart, title: "Müşteri Odaklı", desc: "Her kararımızda müşteri memnuniyetini ön planda tutuyoruz." },
              { icon: Shield, title: "Güvenilir", desc: "Güvenli ödeme ve kaliteli ürün garantisi sunuyoruz." },
              { icon: Truck, title: "Hızlı Teslimat", desc: "Siparişlerinizi en kısa sürede kapınıza ulaştırıyoruz." },
              { icon: MessageCircle, title: "Kolay İletişim", desc: "WhatsApp üzerinden 7/24 destek alabilirsiniz." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#E7E0D8] bg-white p-6">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mb-1 font-semibold text-stone-900">{item.title}</h3>
                <p className="text-sm text-stone-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
