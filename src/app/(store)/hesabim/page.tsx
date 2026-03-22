"use client"

import { User, Package, Heart, MapPin, LogOut } from "lucide-react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function HesabimPage() {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <User className="mx-auto mb-4 size-12 text-stone-300" />
        <h1 className="mb-2 text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading), serif' }}>Hesabım</h1>
        <p className="mb-6 text-stone-500">Hesabınızı görmek için giriş yapın.</p>
        <Link href="/giris" className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-800">
          Giriş Yap
        </Link>
      </div>
    )
  }

  const menuItems = [
    { href: "/siparislerim", icon: Package, label: "Siparişlerim", desc: "Sipariş geçmişi ve takip" },
    { href: "/favorilerim", icon: Heart, label: "Favorilerim", desc: "Beğendiğiniz ürünler" },
    { href: "/hesabim/adreslerim", icon: MapPin, label: "Adreslerim", desc: "Kayıtlı adresleriniz" },
  ]

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-heading), serif' }}>Hesabım</h1>

      {/* User Info */}
      <div className="mb-8 rounded-2xl border border-[#E7E0D8] bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <User className="size-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-stone-900">{session.user.name}</p>
            <p className="text-sm text-stone-500">{session.user.email}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-2xl border border-[#E7E0D8] bg-white p-5 transition-colors hover:border-amber-200 hover:bg-amber-50/50"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
              <item.icon className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-stone-900">{item.label}</p>
              <p className="text-sm text-stone-500">{item.desc}</p>
            </div>
          </Link>
        ))}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-4 rounded-2xl border border-red-100 bg-white p-5 text-left transition-colors hover:bg-red-50"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <LogOut className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-red-600">Çıkış Yap</p>
            <p className="text-sm text-stone-500">Hesabınızdan güvenli çıkış</p>
          </div>
        </button>
      </div>
    </div>
  )
}
