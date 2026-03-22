import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: 'Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni',
}

export default function KVKKPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">KVKK Aydınlatma Metni</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Veri Sorumlusu</h2>
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla şirketimiz tarafından aşağıda açıklanan kapsamda işlenmektedir.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Kişisel Verilerin İşlenme Amaçları</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Sipariş ve ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Müşteri hizmetleri sunulması</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Güvenlik ve doğrulama işlemleri</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. İşlenen Kişisel Veriler</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Ad, soyad, e-posta adresi, telefon numarası</li>
            <li>Teslimat ve fatura adresi bilgileri</li>
            <li>Sipariş ve işlem geçmişi</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Kişisel Verilerin Aktarılması</h2>
          <p>Kişisel verileriniz; kargo ve lojistik firmalarına, ödeme altyapı sağlayıcılarına ve yasal zorunluluklar dahilinde kamu kurumlarına aktarılabilmektedir.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Haklarınız</h2>
          <p>KVKK&apos;nın 11. maddesi kapsamında kişisel verilerinize ilişkin haklarınızı kullanmak için iletişim sayfamız üzerinden bize ulaşabilirsiniz.</p>
        </section>
      </div>
    </div>
  )
}
