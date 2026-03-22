import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { getCached } from "@/lib/cache"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kategoriler",
  description: "Tüm ürün kategorileri",
}

async function getCategories() {
  return getCached("allCategories", 60_000, async () => {
    return db.category.findMany({
      where: { status: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    })
  }).catch(() => [])
}

export default async function KategorilerPage() {
  const categories = await getCategories()

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading), serif' }}>Kategoriler</h1>

      {categories.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-stone-500">Henüz kategori eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-[#E7E0D8] bg-white p-8 transition-all hover:border-amber-200 hover:shadow-lg"
            >
              <div className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-stone-50 text-stone-400 transition-colors group-hover:bg-amber-50 group-hover:text-amber-600">
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </div>
              <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading), serif' }}>
                {cat.name}
              </h3>
              {cat.description && (
                <p className="mt-2 text-sm text-stone-500 line-clamp-2">{cat.description}</p>
              )}
              <p className="mt-3 text-xs text-stone-400">{cat._count?.products || 0} ürün</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
