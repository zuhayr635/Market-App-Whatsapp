"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Bell, Menu, User, Settings, ExternalLink, LogOut, CheckCheck } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import Link from "next/link"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Image,
  FileText,
  Palette,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/urunler": "Ürünler",
  "/admin/kategoriler": "Kategoriler",
  "/admin/siparisler": "Siparişler",
  "/admin/kullanicilar": "Kullanıcılar",
  "/admin/bannerlar": "Bannerlar",
  "/admin/sayfalar": "Sayfalar",
  "/admin/ayarlar": "Ayarlar",
  "/admin/tema": "Tema",
  "/admin/raporlar": "Raporlar",
  "/admin/iletisim": "İletişim",
}

const mobileMenuItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Ürünler", icon: Package, href: "/admin/urunler" },
  { label: "Kategoriler", icon: FolderTree, href: "/admin/kategoriler" },
  { label: "Siparişler", icon: ShoppingCart, href: "/admin/siparisler" },
  { label: "Kullanıcılar", icon: Users, href: "/admin/kullanicilar" },
  { label: "Bannerlar", icon: Image, href: "/admin/bannerlar" },
  { label: "Sayfalar", icon: FileText, href: "/admin/sayfalar" },
  { label: "Ayarlar", icon: Settings, href: "/admin/ayarlar" },
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
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markAsRead(id: string, link: string | null) {
    try {
      await fetch(`/api/admin/notifications?markRead=${id}`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
    if (link) {
      setNotifOpen(false)
      router.push(link)
    }
  }

  async function clearRead() {
    try {
      await fetch("/api/admin/notifications", { method: "DELETE" })
      setNotifications((prev) => prev.filter((n) => !n.isRead))
    } catch {
      // ignore
    }
  }

  const pageTitle = pageTitles[pathname] || "Admin Paneli"
  const adminName = session?.user?.name || "Admin"
  const initials = adminName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menü</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-slate-900 p-0 text-white">
            <div className="flex h-14 items-center border-b border-slate-700 px-4">
              <SheetTitle className="text-lg font-bold tracking-wide text-white">
                MARKET Admin
              </SheetTitle>
            </div>
            <nav className="py-4">
              <ul className="space-y-1 px-2">
                {mobileMenuItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-slate-700 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>

        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            <span className="sr-only">Bildirimler</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-semibold text-sm">Bildirimler</span>
              {notifications.some((n) => n.isRead) && (
                <button
                  onClick={clearRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3 w-3" />
                  Tümünü Temizle
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Bildirim yok
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id, n.link)}
                    className={cn(
                      "flex cursor-pointer flex-col gap-0.5 px-3 py-2.5 hover:bg-muted transition-colors",
                      !n.isRead && "bg-blue-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <span className={cn("text-sm font-medium", !n.isRead ? "" : "text-muted-foreground ml-4")}>
                        {n.title}
                      </span>
                    </div>
                    <p className="ml-4 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="ml-4 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted outline-none">
            <Avatar size="sm">
              <AvatarFallback className="bg-slate-900 text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium lg:inline-block">
              {adminName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuLabel>{adminName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/admin/ayarlar" className="flex items-center gap-2 w-full">
                <User className="h-4 w-4" />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/admin/ayarlar" className="flex items-center gap-2 w-full">
                <Settings className="h-4 w-4" />
                Ayarlar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/" target="_blank" className="flex items-center gap-2 w-full">
                <ExternalLink className="h-4 w-4" />
                Siteyi Görüntüle
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/admin/giris" })}
            >
              <LogOut className="h-4 w-4" />
              Çıkış
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
