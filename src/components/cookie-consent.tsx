'use client'

import { useState, useEffect } from 'react'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-stone-300">
          Sitemizde deneyiminizi iyileştirmek için çerezler kullanıyoruz.{' '}
          <a href="/gizlilik" className="underline text-white">Gizlilik Politikası</a>
          {' '}ve{' '}
          <a href="/kvkk" className="underline text-white">KVKK Aydınlatma Metni</a>
          &apos;ni inceleyebilirsiniz.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm border border-stone-600 rounded hover:bg-stone-700 transition-colors"
          >
            Reddet
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm bg-amber-600 rounded hover:bg-amber-700 transition-colors"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  )
}
