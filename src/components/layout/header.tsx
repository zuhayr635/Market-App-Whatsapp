"use client"

import { useState } from "react"
import { Search, User, Menu, Heart, Package, LogOut, Phone, MapPin, ShoppingBag, X, ChevronDown } from "lucide-react"
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

interface Category {
  id: string
  name: string
  slug: string
}

export function Header({
  siteName = "MARKET",
  categories = [],
}: {
  siteName?: string
  categories?: Category[]
}) {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 w-full" style={{ backgroundColor: 'var(--market-header-bg)' }}>
        {/* Top bar */}
        <div className="hidden border-b md:block" style={{ borderColor: 'rgba(255,102,0,0.15)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-6">
            {/* Left: location */}
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#9A9488' }}>
              <MapPin className="size-3" style={{ color: 'var(--market-primary)' }} />
              <span style={{ fontWeight: 700 }}>İstoç İstanbul</span>
            </div>
            {/* Right: phone with WhatsApp badge */}
            <div className="flex items-center gap-4">
              <a
                href="tel:+905551234567"
                className="flex items-center gap-2 text-xs transition-colors"
                style={{ color: '#9A9488' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--market-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9A9488')}
              >
                {/* WhatsApp badge */}
                <span
                  className="flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: '#25D366', color: '#fff', letterSpacing: '0.02em' }}
                >
                  WP
                </span>
                <Phone className="size-3" />
                +90 555 123 4567
              </a>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="border-b" style={{ borderColor: 'rgba(255,102,0,0.15)' }}>
          <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-6 px-6">
            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                render={<button className="inline-flex items-center justify-center rounded-lg p-2 transition-colors md:hidden" style={{ color: '#9A9488' }} />}
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-80 border-r p-0" style={{ backgroundColor: '#111111', borderColor: 'rgba(255,102,0,0.15)' }}>
                <SheetHeader className="border-b px-6 py-5" style={{ borderColor: 'rgba(255,102,0,0.15)' }}>
                  <SheetTitle>
                    <Link href="/" className="text-2xl font-bold tracking-wide" style={{ color: 'var(--market-primary)' }} onClick={() => setMobileMenuOpen(false)}>
                      {siteName}
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-4">
                  {[
                    { href: "/", label: "Ana Sayfa" },
                    { href: "/urunler", label: "Ürünler" },
                    { href: "/iletisim", label: "İletişim" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-lg px-4 py-3 text-sm font-bold transition-colors"
                      style={{ color: '#9A9488' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--market-primary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,102,0,0.05)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9A9488'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  {categories.length > 0 && (
                    <>
                      <div className="my-2 h-px" style={{ backgroundColor: 'rgba(255,102,0,0.15)' }} />
                      <p className="px-4 py-1 text-xs font-bold uppercase tracking-widest" style={{ color: '#555' }}>Kategoriler</p>
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/urunler?kategori=${cat.slug}`}
                          className="rounded-lg px-4 py-2.5 text-sm font-bold transition-colors"
                          style={{ color: '#9A9488' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--market-primary)'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,102,0,0.05)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9A9488'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </>
                  )}
                  <div className="my-3 h-px" style={{ backgroundColor: 'rgba(255,102,0,0.15)' }} />
                  {session?.user ? (
                    <>
                      <Link href="/hesabim" className="rounded-lg px-4 py-3 text-sm font-bold transition-colors" style={{ color: '#9A9488' }} onClick={() => setMobileMenuOpen(false)}>Hesabım</Link>
                      <Link href="/siparislerim" className="rounded-lg px-4 py-3 text-sm font-bold transition-colors" style={{ color: '#9A9488' }} onClick={() => setMobileMenuOpen(false)}>Siparişlerim</Link>
                      <button onClick={() => { setMobileMenuOpen(false); signOut() }} className="rounded-lg px-4 py-3 text-left text-sm font-bold transition-colors" style={{ color: '#EF4444' }}>
                        Çıkış Yap
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 px-4 pt-2">
                      <Link href="/giris" onClick={() => setMobileMenuOpen(false)}>
                        <button className="w-full rounded-lg py-2.5 text-sm font-bold transition-all" style={{ backgroundColor: 'var(--market-primary)', color: '#FFFFFF' }}>
                          Giriş Yap
                        </button>
                      </Link>
                      <Link href="/kayit" onClick={() => setMobileMenuOpen(false)}>
                        <button className="w-full rounded-lg border py-2.5 text-sm font-bold transition-all" style={{ borderColor: 'rgba(255,102,0,0.25)', color: '#9A9488' }}>
                          Üye Ol
                        </button>
                      </Link>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl font-bold tracking-[0.08em]" style={{ color: 'var(--market-primary)' }}>
                {siteName}
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-0.5 md:flex">
              {[
                { href: "/urunler", label: "Ürünler" },
                { href: "/iletisim", label: "İletişim" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-4 py-2 text-sm font-bold transition-colors"
                  style={{ color: '#9A9488' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--market-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9A9488')}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex-1" />

            {/* Desktop search */}
            <div className="hidden max-w-xs flex-1 md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: '#4A4640' }} />
                <input
                  placeholder="Ürün ara..."
                  className="h-9 w-full rounded-xl pl-10 pr-4 text-sm font-bold outline-none transition-all"
                  style={{
                    backgroundColor: 'rgba(255,102,0,0.06)',
                    border: '1px solid rgba(255,102,0,0.2)',
                    color: '#F5F0E8',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,102,0,0.5)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,102,0,0.2)')}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="inline-flex items-center justify-center rounded-lg p-2 transition-colors md:hidden"
                style={{ color: '#6B6560' }}
              >
                {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
              </button>

              {/* User */}
              <div className="hidden md:block">
                {session?.user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition-colors" style={{ color: '#9A9488' }} />}
                    >
                      <User className="size-4" />
                      <span className="max-w-20 truncate">{session.user.name?.split(" ")[0] || "Hesap"}</span>
                      <ChevronDown className="size-3 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8}>
                      <DropdownMenuItem render={<Link href="/hesabim" />}>
                        <User className="size-4" /> Hesabım
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/siparislerim" />}>
                        <Package className="size-4" /> Siparişlerim
                      </DropdownMenuItem>
                      <DropdownMenuItem render={<Link href="/favorilerim" />}>
                        <Heart className="size-4" /> Favorilerim
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                        <LogOut className="size-4" /> Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/giris">
                      <button className="px-4 py-2 text-sm font-bold transition-colors" style={{ color: '#9A9488' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--market-primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#9A9488')}
                      >
                        Giriş
                      </button>
                    </Link>
                    <Link href="/kayit">
                      <button className="rounded-lg px-4 py-2 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97]" style={{ backgroundColor: 'var(--market-primary)', color: '#FFFFFF' }}>
                        Üye Ol
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/favorilerim" className="hidden md:inline-flex">
                <button className="inline-flex items-center justify-center rounded-lg p-2 transition-colors" style={{ color: '#6B6560' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--market-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6B6560')}
                >
                  <Heart className="size-5" />
                </button>
              </Link>

              <MiniCart />
            </div>
          </div>
        </div>

        {/* Categories nav bar */}
        {categories.length > 0 && (
          <div className="hidden border-b md:block" style={{ borderColor: 'rgba(255,102,0,0.15)', backgroundColor: 'rgba(0,0,0,0.15)' }}>
            <div className="mx-auto flex h-10 max-w-7xl items-center gap-1 overflow-x-auto px-6">
              <Link
                href="/urunler"
                className="flex-shrink-0 rounded-md px-3 py-1 text-xs font-bold transition-colors"
                style={{ color: '#9A9488' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,102,0,0.15)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9A9488'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                Tümü
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/urunler?kategori=${cat.slug}`}
                  className="flex-shrink-0 rounded-md px-3 py-1 text-xs font-bold transition-colors"
                  style={{ color: '#9A9488' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,102,0,0.15)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9A9488'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mobile search */}
        {searchOpen && (
          <div className="border-b px-6 py-3 md:hidden" style={{ borderColor: 'rgba(255,102,0,0.15)', backgroundColor: '#111111' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: '#4A4640' }} />
              <input
                placeholder="Ürün ara..."
                autoFocus
                className="h-10 w-full rounded-xl pl-10 pr-4 text-sm font-bold outline-none"
                style={{
                  backgroundColor: 'rgba(255,102,0,0.06)',
                  border: '1px solid rgba(255,102,0,0.2)',
                  color: '#F5F0E8',
                }}
              />
            </div>
          </div>
        )}
      </header>
    </>
  )
}
