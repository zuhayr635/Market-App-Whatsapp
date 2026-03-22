import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'Gizlilik politikamız ve kişisel veri kullanım esasları',
}

export default function GizlilikPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Gizlilik Politikası</h1>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Çerez (Cookie) Politikası</h2>
          <p>Sitemiz; oturum yönetimi, tercih hatırlama ve analitik amaçlarla çerezler kullanmaktadır. Zorunlu çerezler site işlevselliği için gereklidir ve devre dışı bırakılamaz.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Veri Güvenliği</h2>
          <p>Kişisel verileriniz SSL/TLS şifrelemesi ile korunmakta, yetkisiz erişime karşı teknik ve idari tedbirler alınmaktadır.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Üçüncü Taraf Bağlantılar</h2>
          <p>Sitemiz üçüncü taraf web sitelerine bağlantılar içerebilir. Bu sitelerin gizlilik uygulamalarından sorumlu değiliz.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">İletişim</h2>
          <p>Gizlilik politikamıza ilişkin sorularınız için <a href="/iletisim" className="text-blue-600 underline">iletişim formumuzu</a> kullanabilirsiniz.</p>
        </section>
      </div>
    </div>
  )
}
