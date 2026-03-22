"use client"

import { useState } from "react"
import { Search, User, Menu, Heart, Package, LogOut, ChevronDown, Phone, Mail, ShoppingBag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { MiniCart } from "@/components/store/mini-cart"
import { useCurrency } from "@/hooks/use-currency"

export function Header({ siteName = "MARKET" }: { siteName?: string }) {
  const { data: session } = useSession()
  const { currency, setCurrency } = useCurrency()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[var(--market-header-bg)]/95 backdrop-blur-md">
        {/* Top announcement bar */}
        <div className="hidden border-b border-[#E7E0D8] bg-[#1C1917] md:block">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6 text-xs text-stone-400">
            <div className="flex items-center gap-5">
              <a href="tel:+905551234567" className="flex items-center gap-1.5 transition-colors hover:text-white">
                <Phone className="size-3" />
                +90 555 123 4567
              </a>
              <a href="mailto:info@market.com" className="flex items-center gap-1.5 transition-colors hover:text-white">
                <Mail className="size-3" />
                info@market.com
              </a>
            </div>
            <div className="flex items-center gap-0.5 rounded-full bg-white/10 p-0.5">
              <button
                onClick={() => setCurrency("USD")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  currency === "USD"
                    ? "bg-amber-600 text-white"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                $ USD
              </button>
              <button
                onClick={() => setCurrency("TRY")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  currency === "TRY"
                    ? "bg-amber-600 text-white"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                ₺ TL
              </button>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="border-b border-[#E7E0D8]">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6 md:h-[72px]">
            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                render={<button className="inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-stone-100 md:hidden" />}
              >
                <Menu className="size-5 text-stone-700" />
              </SheetTrigger>
              <SheetContent side="left" className="w-80 border-r-0 bg-[#FEFBF6] p-0">
                <SheetHeader className="border-b border-[#E7E0D8] px-6 py-5">
                  <SheetTitle>
                    <Link href="/" className="font-heading text-2xl font-bold tracking-tight text-stone-900" onClick={() => setMobileMenuOpen(false)}>
                      {siteName}
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-4">
                  {[
                    { href: "/", label: "Ana Sayfa" },
                    { href: "/urunler", label: "Ürünler" },
                    { href: "/iletisim", label: "İletişim" },
                    { href: "/sss", label: "SSS" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-lg px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="my-3 h-px bg-[#E7E0D8]" />
                  {session?.user ? (
                    <>
                      <Link href="/hesabim" className="rounded-lg px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100" onClick={() => setMobileMenuOpen(false)}>
                        Hesabim
                      </Link>
                      <Link href="/siparislerim" className="rounded-lg px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100" onClick={() => setMobileMenuOpen(false)}>
                        Siparislerim
                      </Link>
                      <button onClick={() => { setMobileMenuOpen(false); signOut() }} className="rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                        Cikis Yap
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 px-4 pt-2">
                      <Link href="/giris" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white" size="sm">Giris Yap</Button>
                      </Link>
                      <Link href="/kayit" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full border-[#E7E0D8]" size="sm">Uye Ol</Button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold tracking-tight text-stone-900 md:text-[28px]" style={{ fontFamily: 'var(--font-heading), serif' }}>
                {siteName}
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {[
                { href: "/urunler", label: "Ürünler" },
                { href: "/iletisim", label: "İletişim" },
                { href: "/sss", label: "SSS" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="hidden max-w-xs flex-1 md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder="Ürün ara..."
                  className="h-10 rounded-xl border-[#E7E0D8] bg-white pl-10 text-sm shadow-sm placeholder:text-stone-400 focus:border-amber-400 focus:ring-amber-400/20"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="inline-flex items-center justify-center rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100 md:hidden"
              >
                <Search className="size-5" />
              </button>

              {/* User desktop */}
              <div className="hidden md:block">
                {session?.user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900" />}
                    >
                      <User className="size-4" />
                      <span className="max-w-20 truncate">{session.user.name?.split(" ")[0] || "Hesap"}</span>
                      <ChevronDown className="size-3 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8}>
                      <DropdownMenuItem render={<Link href="/hesabim" />}>
                        <User className="size-4" />
                        Hesabim
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/siparislerim" />}>
                        <Package className="size-4" />
                        Siparislerim
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/favorilerim" />}>
                        <Heart className="size-4" />
                        Favorilerim
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                        <LogOut className="size-4" />
                        Cikis Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/giris">
                      <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900">Giris</Button>
                    </Link>
                    <Link href="/kayit">
                      <Button size="sm" className="bg-amber-700 text-white hover:bg-amber-800">Uye Ol</Button>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/favorilerim" className="hidden md:inline-flex">
                <button className="inline-flex items-center justify-center rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-amber-700">
                  <Heart className="size-5" />
                </button>
              </Link>

              <MiniCart />
            </div>
          </div>
        </div>

        {/* Mobile search expandable */}
        {searchOpen && (
          <div className="border-b border-[#E7E0D8] bg-white px-6 py-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <Input placeholder="Ürün ara..." className="pl-10 border-[#E7E0D8]" autoFocus />
            </div>
          </div>
        )}
      </header>
    </>
  )
}
