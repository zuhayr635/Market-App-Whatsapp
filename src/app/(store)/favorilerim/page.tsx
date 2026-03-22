"use client"

import { useState, useEffect } from "react"
import { Heart, Trash2, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

export default function FavorilerPage() {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) { setLoading(false); return }
    fetch("/api/favorites")
      .then(r => r.json())
      .then(data => setFavorites(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <Heart className="mx-auto mb-4 size-12 text-stone-300" />
        <h1 className="mb-2 text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading), serif' }}>Favorilerim</h1>
        <p className="mb-6 text-stone-500">Favorilerinizi görmek için giriş yapın.</p>
        <Link href="/giris" className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-800">
          Giriş Yap
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h1 className="mb-8 text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading), serif' }}>Favorilerim</h1>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-72 animate-pulse rounded-2xl bg-stone-100" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading), serif' }}>Favorilerim</h1>
      {favorites.length === 0 ? (
        <div className="py-16 text-center">
          <Heart className="mx-auto mb-4 size-12 text-stone-300" />
          <p className="mb-4 text-stone-500">Henüz favori ürününüz yok.</p>
          <Link href="/urunler" className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-800">
            <ShoppingBag className="size-4" /> Ürünleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {favorites.map((fav: any) => (
            <div key={fav.id} className="overflow-hidden rounded-2xl border border-[#E7E0D8] bg-white">
              <Link href={`/urun/${fav.product?.slug || fav.productId}`}>
                <div className="aspect-square bg-stone-100" />
              </Link>
              <div className="p-4">
                <h3 className="text-sm font-medium text-stone-900">{fav.product?.name || "Ürün"}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
