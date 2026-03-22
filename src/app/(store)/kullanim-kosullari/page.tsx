import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: 'Site kullanım koşulları ve hizmet şartları',
}

export default function KullanimKosullariPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Kullanım Koşulları</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Genel Hükümler</h2>
          <p>Bu web sitesini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız siteyi kullanmayınız.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Sipariş ve Ödeme</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Siparişler WhatsApp üzerinden onaylanmaktadır.</li>
            <li>Ödemeler havale/EFT yöntemiyle yapılmaktadır.</li>
            <li>Dekont yüklendikten sonra sipariş işleme alınır.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. İptal ve İade</h2>
          <p>Sipariş iptali ve iade talepleri WhatsApp veya iletişim formu aracılığıyla iletilmelidir. Teslimattan itibaren 14 gün içinde iade hakkı mevcuttur.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Sorumluluk Sınırlaması</h2>
          <p>Ürün görselleri temsili olabilir. Ürün özellikleri önceden bildirilmeksizin değiştirilebilir.</p>
        </section>
      </div>
    </div>
  )
}
