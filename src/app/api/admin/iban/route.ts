import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function GET() {
  const ibans = await db.ibanInfo.findMany({
    where: { status: true },
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(ibans)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { bankName, iban, accountHolder, branchCode, currency, sortOrder } = body

  if (!bankName || !iban || !accountHolder) {
    return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 })
  }

  const ibanInfo = await db.ibanInfo.create({
    data: {
      bankName,
      iban,
      accountHolder,
      branchCode: branchCode || null,
      currency: currency || "TRY",
      sortOrder: sortOrder || 0,
      status: true,
    },
  })

  return NextResponse.json(ibanInfo)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { id, ...data } = body

  if (!id) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
  }

  const updated = await db.ibanInfo.update({
    where: { id },
    data,
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
  }

  await db.ibanInfo.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
