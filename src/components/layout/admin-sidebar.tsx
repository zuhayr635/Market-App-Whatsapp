"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Image,
  FileText,
  Settings,
  Palette,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { useState } from "react"

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Ürünler", icon: Package, href: "/admin/urunler" },
  { label: "Kategoriler", icon: FolderTree, href: "/admin/kategoriler" },
  { label: "Siparişler", icon: ShoppingCart, href: "/admin/siparisler" },
  { label: "Kullanıcılar", icon: Users, href: "/admin/kullanicilar" },
  { label: "Bannerlar", icon: Image, href: "/admin/bannerlar" },
  { label: "Sayfalar", icon: FileText, href: "/admin/sayfalar" },
  { type: "separator" as const },
  { label: "Ayarlar", icon: Settings, href: "/admin/ayarlar" },
  { label: "Tema", icon: Palette, href: "/admin/tema" },
  { label: "Raporlar", icon: BarChart3, href: "/admin/raporlar" },
] as const

type MenuItem =
  | { label: string; icon: React.ComponentType<{ className?: string }>; href: string }
  | { type: "separator" }

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col bg-slate-900 text-white transition-all duration-300 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-slate-700 px-4">
        {collapsed ? (
          <span className="mx-auto text-lg font-bold">M</span>
        ) : (
          <span className="text-lg font-bold tracking-wide">MARKET Admin</span>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {(menuItems as readonly MenuItem[]).map((item, index) => {
            if ("type" in item && item.type === "separator") {
              return (
                <li key={`sep-${index}`} className="my-3">
                  <div className="h-px bg-slate-700" />
                </li>
              )
            }

            if (!("href" in item)) return null

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
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-700 p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-9 w-full text-slate-300 hover:bg-slate-800 hover:text-white",
            collapsed ? "justify-center" : "justify-start gap-3 px-3"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span className="text-sm">Daralt</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
