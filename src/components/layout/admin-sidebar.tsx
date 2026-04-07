"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users,
  Image, FileText, Settings, Palette, BarChart3, Activity,
  PanelLeftClose, PanelLeftOpen, TrendingUp, Tag, Bell,
  MessageSquare, CreditCard,
} from "lucide-react"
import { useState } from "react"

const menuGroups = [
  {
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    ],
  },
  {
    label: "MAĞAZA",
    items: [
      { label: "Ürünler", icon: Package, href: "/admin/urunler" },
      { label: "Kategoriler", icon: FolderTree, href: "/admin/kategoriler" },
      { label: "Siparişler", icon: ShoppingCart, href: "/admin/siparisler" },
      { label: "Kuponlar", icon: Tag, href: "/admin/kuponlar" },
      { label: "Bannerlar", icon: Image, href: "/admin/bannerlar" },
    ],
  },
  {
    label: "MÜŞTERİLER",
    items: [
      { label: "Kullanıcılar", icon: Users, href: "/admin/kullanicilar" },
      { label: "Sepetler", icon: ShoppingCart, href: "/admin/sepetler" },
      { label: "İletişim", icon: MessageSquare, href: "/admin/iletisim" },
      { label: "Stok Uyarıları", icon: Bell, href: "/admin/stok-uyarilari" },
    ],
  },
  {
    label: "YÖNETİM",
    items: [
      { label: "Sayfalar", icon: FileText, href: "/admin/sayfalar" },
      { label: "Tema", icon: Palette, href: "/admin/tema" },
      { label: "Raporlar", icon: BarChart3, href: "/admin/raporlar" },
      { label: "Sistem Logları", icon: Activity, href: "/admin/sistem-loglari" },
    ],
  },
  {
    label: "AYARLAR",
    items: [
      { label: "Genel", icon: Settings, href: "/admin/ayarlar/genel" },
      { label: "Döviz Kuru", icon: TrendingUp, href: "/admin/ayarlar/doviz" },
      { label: "SMS", icon: MessageSquare, href: "/admin/ayarlar/sms" },
      { label: "IBAN", icon: CreditCard, href: "/admin/ayarlar/iban" },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="hidden h-screen flex-col transition-[width] duration-150 md:flex overflow-hidden"
      style={{
        width: collapsed ? "56px" : "220px",
        backgroundColor: 'var(--admin-sidebar)',
        borderRight: '1px solid var(--admin-border)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        className="flex h-12 items-center px-4 shrink-0"
        style={{ borderBottom: '1px solid var(--admin-border)' }}
      >
        {collapsed ? (
          <div className="mx-auto flex size-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--admin-teal-dim)', border: '1px solid var(--admin-teal-border)' }}>
            <span className="text-xs font-black" style={{ color: 'var(--admin-teal)' }}>M</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--admin-teal-dim)', border: '1px solid var(--admin-teal-border)' }}>
              <span className="text-xs font-black" style={{ color: 'var(--admin-teal)' }}>M</span>
            </div>
            <div>
              <p className="text-sm font-bold leading-none tracking-wide" style={{ color: '#E2E8F0' }}>MARKET</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--admin-teal)' }}>admin</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: 'none' }}>
        {menuGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>
            {group.label && !collapsed && (
              <p className="mb-1.5 px-4 text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--admin-text-dim)' }}>
                {group.label}
              </p>
            )}
            {group.label && collapsed && gi > 0 && (
              <div className="mx-3 mb-1.5 h-px" style={{ backgroundColor: 'var(--admin-border)' }} />
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-100 ${
                        active
                          ? "text-[var(--admin-teal)] bg-[var(--admin-teal-dim)] shadow-[inset_2px_0_0_var(--admin-teal)]"
                          : "text-[var(--admin-text-muted)] hover:bg-white/[0.04] hover:text-slate-300"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse */}
      <div className="shrink-0 p-2" style={{ borderTop: '1px solid var(--admin-border)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-100 text-[var(--admin-text-muted)] hover:bg-white/[0.04] hover:text-slate-300"
        >
          {collapsed
            ? <PanelLeftOpen className="mx-auto size-4" />
            : <><PanelLeftClose className="size-4 shrink-0" /><span>Daralt</span></>
          }
        </button>
      </div>
    </aside>
  )
}
