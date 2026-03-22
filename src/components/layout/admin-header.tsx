"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Bell, Menu, User, Settings, ExternalLink, LogOut, CheckCheck, ChevronRight } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import Link from "next/link"
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart,
  Users, Image, FileText, Palette, BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string; type: string; title: string; message: string
  link: string | null; isRead: boolean; createdAt: string
}

const pageTitles: Record<string, string[]> = {
  "/admin": ["Dashboard"],
  "/admin/urunler": ["Ürünler"],
  "/admin/kategoriler": ["Ürünler", "Kategoriler"],
  "/admin/siparisler": ["Siparişler"],
  "/admin/kullanicilar": ["Müşteriler", "Kullanıcılar"],
  "/admin/bannerlar": ["Sayfalar", "Bannerlar"],
  "/admin/sayfalar": ["Sayfalar"],
  "/admin/ayarlar/genel": ["Ayarlar", "Genel"],
  "/admin/ayarlar/doviz": ["Ayarlar", "Döviz Kuru"],
  "/admin/ayarlar/sms": ["Ayarlar", "SMS"],
  "/admin/ayarlar/iban": ["Ayarlar", "IBAN"],
  "/admin/tema": ["Yönetim", "Tema"],
  "/admin/raporlar": ["Yönetim", "Raporlar"],
  "/admin/iletisim": ["Müşteriler", "İletişim"],
  "/admin/stok-uyarilari": ["Müşteriler", "Stok Uyarıları"],
  "/admin/sistem-loglari": ["Yönetim", "Sistem Logları"],
}

const mobileMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Ürünler", icon: Package, href: "/admin/urunler" },
  { label: "Kategoriler", icon: FolderTree, href: "/admin/kategoriler" },
  { label: "Siparişler", icon: ShoppingCart, href: "/admin/siparisler" },
  { label: "Kullanıcılar", icon: Users, href: "/admin/kullanicilar" },
  { label: "Bannerlar", icon: Image, href: "/admin/bannerlar" },
  { label: "Sayfalar", icon: FileText, href: "/admin/sayfalar" },
  { label: "Ayarlar", icon: Settings, href: "/admin/ayarlar/genel" },
  { label: "Tema", icon: Palette, href: "/admin/tema" },
  { label: "Raporlar", icon: BarChart3, href: "/admin/raporlar" },
]

export function AdminHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markAsRead(id: string, link: string | null) {
    try {
      await fetch(`/api/admin/notifications?markRead=${id}`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
    if (link) { setNotifOpen(false); router.push(link) }
  }

  async function clearRead() {
    try {
      await fetch("/api/admin/notifications", { method: "DELETE" })
      setNotifications(prev => prev.filter(n => !n.isRead))
    } catch { /* ignore */ }
  }

  const breadcrumb = pageTitles[pathname] ?? ["Admin Paneli"]
  const adminName = session?.user?.name || "Admin"
  const initials = adminName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between px-5"
      style={{ backgroundColor: 'var(--admin-header)', borderBottom: '1px solid var(--admin-border)' }}
    >
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-2">
        {/* Mobile trigger */}
        <Sheet>
          <SheetTrigger className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-lg md:hidden"
            style={{ color: 'var(--admin-text-muted)' }}>
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0"
            style={{ backgroundColor: 'var(--admin-sidebar)', borderRight: '1px solid var(--admin-border)' }}>
            <div className="flex h-12 items-center px-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <SheetTitle className="text-sm font-bold" style={{ color: 'var(--admin-teal)' }}>MARKET Admin</SheetTitle>
            </div>
            <nav className="py-3">
              {mobileMenuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link key={item.href} href={item.href}
                    className={cn("flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-all", active ? "" : "")}
                    style={active
                      ? { color: 'var(--admin-teal)', backgroundColor: 'var(--admin-teal-dim)' }
                      : { color: 'var(--admin-text-muted)' }
                    }
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3" style={{ color: '#1E293B' }} />}
              <span
                className="text-sm font-medium"
                style={{ color: i === breadcrumb.length - 1 ? '#CBD5E1' : '#334155' }}
              >
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--admin-text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#CBD5E1' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--admin-text-muted)' }}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold"
                style={{ backgroundColor: 'var(--admin-teal)', color: '#07080C' }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold">Bildirimler</span>
              {notifications.some(n => n.isRead) && (
                <button onClick={clearRead} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <CheckCheck className="h-3 w-3" /> Temizle
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">Bildirim yok</div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} onClick={() => markAsRead(n.id, n.link)}
                    className="flex cursor-pointer flex-col gap-0.5 px-3 py-2.5 transition-colors hover:bg-muted">
                    <div className="flex items-center gap-2">
                      {!n.isRead && <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--admin-teal)' }} />}
                      <span className={cn("text-xs font-medium", n.isRead && "ml-3.5 text-muted-foreground")}>{n.title}</span>
                    </div>
                    <p className="ml-3.5 text-[11px] text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="ml-3.5 text-[10px] text-muted-foreground">{new Date(n.createdAt).toLocaleString("tr-TR")}</p>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium outline-none transition-colors"
            style={{ color: 'var(--admin-text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
          >
            <Avatar size="sm">
              <AvatarFallback className="text-[10px] font-bold"
                style={{ backgroundColor: 'var(--admin-teal-dim)', color: 'var(--admin-teal)', border: '1px solid var(--admin-teal-border)' }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-xs lg:block" style={{ color: '#94A3B8' }}>{adminName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs">{adminName}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/admin/ayarlar/genel" className="flex items-center gap-2 w-full">
                <User className="h-4 w-4" /> Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/admin/ayarlar/genel" className="flex items-center gap-2 w-full">
                <Settings className="h-4 w-4" /> Ayarlar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/" target="_blank" className="flex items-center gap-2 w-full">
                <ExternalLink className="h-4 w-4" /> Siteyi Görüntüle
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/admin/giris" })}>
              <LogOut className="h-4 w-4" /> Çıkış
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
