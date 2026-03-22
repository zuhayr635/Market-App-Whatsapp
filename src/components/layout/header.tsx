"use client"

import { useState } from "react"
import { Search, User, Menu, Heart, Package, LogOut, ChevronDown, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

export function Header() {
  const { data: session } = useSession()
  const { currency, setCurrency } = useCurrency()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[var(--market-header-bg)] shadow-sm">
      {/* Top Bar */}
      <div className="hidden border-b border-border/50 bg-muted/30 md:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="size-3" />
              +90 555 123 4567
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="size-3" />
              info@market.com
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrency("USD")}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                currency === "USD"
                  ? "bg-foreground text-background"
                  : "hover:text-foreground"
              }`}
            >
              USD
            </button>
            <span className="text-border">/</span>
            <button
              onClick={() => setCurrency("TRY")}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                currency === "TRY"
                  ? "bg-foreground text-background"
                  : "hover:text-foreground"
              }`}
            >
              TL
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:h-16">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" />
            }
          >
            <Menu className="size-5" />
            <span className="sr-only">Menü</span>
          </SheetTrigger>

          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>
                <Link
                  href="/"
                  className="text-xl font-bold tracking-tight"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  MARKET
                </Link>
              </SheetTitle>
            </SheetHeader>

            {/* Mobile Search */}
            <div className="border-b px-4 py-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Ürün ara..."
                  className="pl-8"
                />
              </div>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col px-2 py-2">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ana Sayfa
              </Link>
              <Link
                href="/urunler"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ürünler
              </Link>
              <Link
                href="/kategoriler"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Kategoriler
              </Link>
              <Link
                href="/hakkimizda"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                Hakkımızda
              </Link>
              <Link
                href="/iletisim"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                onClick={() => setMobileMenuOpen(false)}
              >
                İletişim
              </Link>
            </nav>

            <div className="mx-4 my-2 h-px bg-border" />

            {/* Mobile User Section */}
            <div className="flex flex-col px-2 py-2">
              {session?.user ? (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    {session.user.name || session.user.email}
                  </div>
                  <Link
                    href="/hesabim"
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="size-4" />
                    Hesabım
                  </Link>
                  <Link
                    href="/siparislerim"
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="size-4" />
                    Siparişlerim
                  </Link>
                  <Link
                    href="/favorilerim"
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="size-4" />
                    Favorilerim
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                    Çıkış Yap
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-3 py-2">
                  <Link href="/giris" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full" size="sm">
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/kayit" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full" size="sm">
                      Üye Ol
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Currency */}
            <div className="mx-4 my-2 h-px bg-border" />
            <div className="flex items-center gap-2 px-5 py-2 text-xs text-muted-foreground">
              <span>Para birimi:</span>
              <button
                onClick={() => setCurrency("USD")}
                className={`rounded px-2 py-0.5 font-medium transition-colors ${
                  currency === "USD"
                    ? "bg-foreground text-background"
                    : "hover:text-foreground"
                }`}
              >
                USD
              </button>
              <span>/</span>
              <button
                onClick={() => setCurrency("TRY")}
                className={`rounded px-2 py-0.5 font-medium transition-colors ${
                  currency === "TRY"
                    ? "bg-foreground text-background"
                    : "hover:text-foreground"
                }`}
              >
                TL
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 text-xl font-extrabold tracking-tight transition-opacity hover:opacity-80 md:text-2xl"
        >
          MARKET
        </Link>

        {/* Desktop Search */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ürün ara..."
              className="h-9 w-full rounded-lg border-border/60 bg-muted/40 pl-9 pr-4 text-sm transition-colors placeholder:text-muted-foreground/60 focus:bg-background"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="ml-auto flex items-center gap-1">
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          >
            <Search className="size-5" />
            <span className="sr-only">Ara</span>
          </Button>

          {/* Desktop User Menu */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="sm" className="gap-1.5" />}
                >
                  <User className="size-4" />
                  <span className="max-w-24 truncate text-sm">
                    {session.user.name?.split(" ")[0] || "Hesap"}
                  </span>
                  <ChevronDown className="size-3 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <DropdownMenuItem render={<Link href="/hesabim" />}>
                    <User className="size-4" />
                    Hesabım
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/siparislerim" />}>
                    <Package className="size-4" />
                    Siparişlerim
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/favorilerim" />}>
                    <Heart className="size-4" />
                    Favorilerim
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="size-4" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/giris">
                  <Button variant="ghost" size="sm">
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/kayit">
                  <Button size="sm">Üye Ol</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Favorites - Desktop */}
          <Link href="/favorilerim" className="hidden md:inline-flex">
            <Button variant="ghost" size="icon">
              <Heart className="size-5" />
              <span className="sr-only">Favoriler</span>
            </Button>
          </Link>

          {/* Cart */}
          <MiniCart />
        </div>
      </div>

      {/* Mobile Expandable Search */}
      {mobileSearchOpen && (
        <div className="border-t px-4 py-2 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ürün ara..."
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
