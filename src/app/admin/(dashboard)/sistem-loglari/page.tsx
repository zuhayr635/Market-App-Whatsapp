"use client"

import { useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search, Activity } from "lucide-react"

interface AdminLog {
  id: string
  action: string
  detail: string | null
  ip: string | null
  createdAt: string
  admin: {
    name: string
    email: string
  }
}

export default function SistemLoglariPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set("search", search)
    const res = await fetch(`/api/admin/logs?${params}`)
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetchLogs, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchLogs, search])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sistem Logları</h1>
        <p className="text-sm text-muted-foreground">Admin işlem geçmişi</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="İşlem veya detay ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="text-sm text-muted-foreground">
        Toplam <span className="font-semibold text-foreground">{total}</span> log kaydı
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Yükleniyor...</div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Activity className="size-10 mb-3 opacity-20" />
          <p>Henüz işlem logu bulunmuyor</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">İşlem</th>
                  <th className="px-4 py-3">Detay</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{log.admin.name}</p>
                        <p className="text-xs text-muted-foreground">{log.admin.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {log.detail ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {log.ip ?? <span className="opacity-40">—</span>}
                    </td>
                  </tr>
                ))}
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
