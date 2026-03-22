"use client"

import { useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search, Users, ShoppingCart, Mail, Phone } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  status: "ACTIVE" | "PASSIVE" | "BANNED"
  role: string
  createdAt: string
  _count: { orders: number }
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  ACTIVE:  { label: "Aktif",   cls: "bg-green-50 text-green-700 border-green-200" },
  PASSIVE: { label: "Pasif",   cls: "bg-gray-50 text-gray-600 border-gray-200" },
  BANNED:  { label: "Banlı",   cls: "bg-red-50 text-red-700 border-red-200" },
}

export default function KullanicilarPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set("search", search)
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
      setTotal(data.total)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchUsers, search])

  async function toggleStatus(user: User) {
    const next = user.status === "ACTIVE" ? "PASSIVE" : "ACTIVE"
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: next } : u))
      toast.success(next === "ACTIVE" ? "Kullanıcı aktif edildi" : "Kullanıcı pasif edildi")
    } else {
      toast.error("Güncelleme başarısız")
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <p className="text-sm text-muted-foreground">Kayıtlı üyeleri yönetin</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="İsim, e-posta veya telefon ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        Toplam <span className="font-semibold text-foreground">{total}</span> kullanıcı
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Yükleniyor...</div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Users className="size-10 mb-3 opacity-20" />
          <p>Kullanıcı bulunamadı</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">Kullanıcı</th>
                  <th className="px-4 py-3">İletişim</th>
                  <th className="px-4 py-3">Sipariş</th>
                  <th className="px-4 py-3">Kayıt</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => {
                  const st = statusLabel[user.status] ?? statusLabel.PASSIVE
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {user.name[0]}{user.surname[0]}
                          </div>
                          <div>
                            <p className="font-medium">{user.name} {user.surname}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3" />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <ShoppingCart className="size-3.5 text-muted-foreground" />
                          <span className="font-medium">{user._count.orders}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.status !== "BANNED" && (
                          <button
                            onClick={() => toggleStatus(user)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {user.status === "ACTIVE" ? "Pasife Al" : "Aktif Et"}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">
                Sayfa {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
