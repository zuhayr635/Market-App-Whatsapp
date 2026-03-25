export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCached } from "@/lib/cache"

export async function GET() {
  const rate = await getCached("exchangeRate", 300_000, async () => {
    const exchangeRate = await db.exchangeRate.findFirst({
      where: { currency: "TRY" },
      orderBy: { updatedAt: "desc" },
    })
    if (exchangeRate) return Number(exchangeRate.rate)

    const setting = await db.setting.findUnique({
      where: { key: "usd_rate" },
    })
    return setting ? parseFloat(setting.value) : 32.5
  }).catch(() => 32.5)

  return NextResponse.json({ rate })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rate } = body

    if (!rate || isNaN(Number(rate))) {
      return NextResponse.json({ error: "Geçersiz kur değeri" }, { status: 400 })
    }

    const numRate = Number(rate)

    // Upsert ExchangeRate
    await db.exchangeRate.upsert({
      where: { id: "main" },
      create: { id: "main", currency: "TRY", rate: numRate },
      update: { rate: numRate, updatedAt: new Date() },
    })

    // Also update Setting
    await db.setting.upsert({
      where: { key: "usd_rate" },
      create: { key: "usd_rate", value: String(numRate), group: "currency" },
      update: { value: String(numRate) },
    })

    return NextResponse.json({ rate: numRate })
  } catch {
    return NextResponse.json({ error: "Kur güncellenemedi" }, { status: 500 })
  }
}
