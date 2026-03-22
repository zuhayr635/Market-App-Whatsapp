import { Truck, Clock, MapPin, Package } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kargo Bilgileri",
  description: "Kargo ve teslimat bilgileri",
}

export default function KargoBilgileriPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-stone-900" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Kargo Bilgileri</h1>

      <div className="space-y-8">
        <section className="rounded-2xl border border-[#E7E0D8] bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Truck className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Teslimat Süresi</h2>
          </div>
          <p className="text-stone-600">Siparişleriniz ödeme onayından sonra 1-3 iş günü içinde kargoya teslim edilir. Kargo süresi bulunduğunuz bölgeye göre 1-5 iş günü arasında değişmektedir.</p>
        </section>

        <section className="rounded-2xl border border-[#E7E0D8] bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Package className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Kargo Ücreti</h2>
          </div>
          <p className="text-stone-600">Kargo ücretleri sipariş tutarına ve teslimat adresine göre belirlenir. Belirli tutarın üzerindeki siparişlerde kargo ücretsizdir.</p>
        </section>

        <section className="rounded-2xl border border-[#E7E0D8] bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <MapPin className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Kargo Takip</h2>
          </div>
          <p className="text-stone-600">Siparişiniz kargoya verildiğinde takip numarası WhatsApp veya e-posta ile iletilir. Kargo durumunu siparişlerim sayfasından takip edebilirsiniz.</p>
        </section>

        <section className="rounded-2xl border border-[#E7E0D8] bg-white p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Clock className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Teslimat Saatleri</h2>
          </div>
          <p className="text-stone-600">Kargo teslimatları hafta içi 09:00 - 18:00 saatleri arasında yapılmaktadır. Cumartesi günleri bazı bölgelerde teslimat yapılabilmektedir.</p>
        </section>
      </div>
    </div>
  )
}
