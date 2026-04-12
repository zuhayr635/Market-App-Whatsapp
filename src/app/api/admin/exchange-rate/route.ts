import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { clearCache } from "@/lib/cache"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

async function getCurrentRate() {
  const exchangeRate = await db.exchangeRate.findFirst({
    where: { currency: "TRY" },
    orderBy: { updatedAt: "desc" },
  })

  if (exchangeRate) {
    const sourceSetting = await db.setting.findUnique({ where: { key: "usd_rate_source" } })
    return {
      rate: Number(exchangeRate.rate),
      lastUpdated: exchangeRate.updatedAt,
      source: sourceSetting?.value ?? "manual",
    }
  }

  const setting = await db.setting.findUnique({ where: { key: "usd_rate" } })
  return {
    rate: setting ? parseFloat(setting.value) : 32.5,
    lastUpdated: null,
    source: "manual",
  }
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const data = await getCurrentRate()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Kur bilgisi alınamadı" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const body = await request.json()
    const { rate } = body

    if (!rate || isNaN(Number(rate))) {
      return NextResponse.json({ error: "Geçersiz kur değeri" }, { status: 400 })
    }

    const numRate = Number(rate)

    await db.exchangeRate.upsert({
      where: { id: "main" },
      create: { id: "main", currency: "TRY", rate: numRate },
      update: { rate: numRate, updatedAt: new Date() },
    })

    await db.setting.upsert({
      where: { key: "usd_rate" },
      create: { key: "usd_rate", value: String(numRate), group: "currency" },
      update: { value: String(numRate) },
    })

    await db.setting.upsert({
      where: { key: "usd_rate_source" },
      create: { key: "usd_rate_source", value: "manual", group: "currency" },
      update: { value: "manual" },
    })

    clearCache("exchangeRate")
    return NextResponse.json({ rate: numRate, source: "manual" })
  } catch {
    return NextResponse.json({ error: "Kur güncellenemedi" }, { status: 500 })
  }
}

export async function PUT() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD")
    if (!response.ok) {
      throw new Error("Döviz API'den veri alınamadı")
    }

    const data = await response.json()
    const tryRate = data?.rates?.TRY

    if (!tryRate || isNaN(Number(tryRate))) {
      throw new Error("Geçersiz kur verisi")
    }

    const numRate = Number(tryRate)

    await db.exchangeRate.upsert({
      where: { id: "main" },
      create: { id: "main", currency: "TRY", rate: numRate },
      update: { rate: numRate, updatedAt: new Date() },
    })

    await db.setting.upsert({
      where: { key: "usd_rate" },
      create: { key: "usd_rate", value: String(numRate), group: "currency" },
      update: { value: String(numRate) },
    })

    await db.setting.upsert({
      where: { key: "usd_rate_source" },
      create: { key: "usd_rate_source", value: "auto", group: "currency" },
      update: { value: "auto" },
    })

    clearCache("exchangeRate")
    return NextResponse.json({ rate: numRate, source: "auto" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Otomatik güncelleme başarısız" },
      { status: 500 }
    )
  }
}
