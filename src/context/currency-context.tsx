"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { formatTl, usdToTl } from "@/lib/currency"

interface CurrencyContextValue {
  rate: number
  formatPrice: (usd: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue>({
  rate: 32.5,
  formatPrice: (usd) => formatTl(usdToTl(usd, 32.5)),
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [rate, setRate] = useState(32.5)

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((res) => res.json())
      .then((data) => {
        if (data.rate && !isNaN(Number(data.rate))) {
          setRate(Number(data.rate))
        }
      })
      .catch(() => {})
  }, [])

  const formatPrice = (usd: number) => formatTl(usdToTl(usd, rate))

  return (
    <CurrencyContext.Provider value={{ rate, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export { CurrencyContext }
