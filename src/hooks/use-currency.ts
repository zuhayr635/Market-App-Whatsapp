"use client"

import { useContext } from "react"
import { CurrencyContext } from "@/context/currency-context"

export function useCurrency() {
  return useContext(CurrencyContext)
}
