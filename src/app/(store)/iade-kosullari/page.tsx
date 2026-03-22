import { RotateCcw } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "İade Koşulları",
  description: "İade ve değişim koşulları",
}

export default function IadeKosullariPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading), serif' }}>İade Koşulları</h1>

      <div className="space-y-6 text-stone-600 leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">1. İade Süresi</h2>
          <p>Ürünlerinizi teslim aldığınız tarihten itibaren 14 gün içinde iade edebilirsiniz. Bu süre içinde yapılan iade talepleri değerlendirmeye alınır.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">2. İade Koşulları</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Ürün kullanılmamış ve orijinal ambalajında olmalıdır.</li>
            <li>Ürün etiketi çıkarılmamış olmalıdır.</li>
            <li>Fatura veya sipariş belgesi iade ile birlikte gönderilmelidir.</li>
            <li>Hijyen ürünleri (iç giyim, kozmetik vb.) açılmışsa iade edilemez.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">3. İade Süreci</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>WhatsApp veya iletişim formu üzerinden iade talebinizi iletin.</li>
            <li>Talebiniz onaylandıktan sonra ürünü belirtilen adrese gönderin.</li>
            <li>Ürün tarafımıza ulaştıktan sonra kontrol edilir.</li>
            <li>Onaylanan iadeler 3-5 iş günü içinde hesabınıza iade edilir.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">4. Değişim</h2>
          <p>Beden, renk veya model değişikliği talepleri stok durumuna göre değerlendirilir. Değişim için lütfen WhatsApp üzerinden bizimle iletişime geçin.</p>
        </section>
      </div>
    </div>
  )
}
