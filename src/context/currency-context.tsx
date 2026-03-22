"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { formatUsd, formatTl, usdToTl } from "@/lib/currency"

type CurrencyType = "USD" | "TRY"

interface CurrencyContextValue {
  currency: CurrencyType
  rate: number
  setCurrency: (currency: CurrencyType) => void
  formatPrice: (usd: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  rate: 32.5,
  setCurrency: () => {},
  formatPrice: (usd) => formatUsd(usd),
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyType>("USD")
  const [rate, setRate] = useState(32.5)

  // Read cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)currency_pref=([^;]*)/)
    if (match) {
      const pref = match[1] as CurrencyType
      if (pref === "USD" || pref === "TRY") {
        setCurrencyState(pref)
      }
    }
  }, [])

  // Fetch rate on mount
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

  const setCurrency = useCallback((newCurrency: CurrencyType) => {
    setCurrencyState(newCurrency)
    // Save to cookie (1 year)
    document.cookie = `currency_pref=${newCurrency}; path=/; max-age=${60 * 60 * 24 * 365}`
  }, [])

  const formatPrice = useCallback(
    (usd: number) => {
      if (currency === "TRY") {
        return formatTl(usdToTl(usd, rate))
      }
      return formatUsd(usd)
    },
    [currency, rate]
  )

  return (
    <CurrencyContext.Provider value={{ currency, rate, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export { CurrencyContext }
