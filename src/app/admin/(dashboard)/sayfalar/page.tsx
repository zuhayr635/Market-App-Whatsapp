import Link from "next/link"
import { HelpCircle, ChevronRight, FileText } from "lucide-react"

const pages = [
  {
    href: "/admin/sayfalar/sss",
    icon: HelpCircle,
    title: "Sıkça Sorulan Sorular",
    description: "SSS sayfasındaki soru ve cevapları yönetin",
  },
]

const staticPages = [
  { slug: "hakkimizda", title: "Hakkımızda" },
  { slug: "gizlilik", title: "Gizlilik Politikası" },
  { slug: "kvkk", title: "KVKK Aydınlatma Metni" },
  { slug: "kullanim-kosullari", title: "Kullanım Koşulları" },
  { slug: "iade-kosullari", title: "İade ve Değişim Koşulları" },
  { slug: "kargo-bilgileri", title: "Kargo Bilgileri" },
]

export default function SayfalarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">İçerik Sayfaları</h1>
        <p className="text-sm text-muted-foreground">Site içerik sayfalarını yönetin</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((p) => {
          const Icon = p.icon
          return (
            <Link
              key={p.href}
              href={p.href}
              className="flex items-center gap-4 rounded-xl border bg-white p-5 transition-all hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Sayfa İçerikleri</h2>
        <p className="text-sm text-muted-foreground mb-3">Statik sayfaların içeriklerini düzenleyin</p>

        <div className="divide-y rounded-xl border bg-white overflow-hidden">
          {staticPages.map((p) => (
            <div key={p.slug} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <FileText className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">/sayfalar/icerik/{p.slug}</p>
              </div>
              <Link
                href={`/admin/sayfalar/icerik/${p.slug}`}
                className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                Düzenle
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
