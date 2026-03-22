'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function StockAlertForm({ productId }: { productId: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/stock-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmitted(true)
      toast.success(data.message)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-sm text-green-600 bg-green-50 rounded-lg p-3">
        Stok geldiğinde e-posta ile bilgilendirileceksiniz.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-sm text-gray-600">Stok geldiğinde haber verelim:</p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta adresiniz"
          required
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Bildir'}
        </button>
      </div>
    </form>
  )
}
