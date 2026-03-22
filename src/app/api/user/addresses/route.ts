import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
  }

  const addresses = await db.address.findMany({
    where: { userId: session.user.id, status: true },
    include: {
      city: { select: { id: true, name: true } },
      district: { select: { id: true, name: true } },
    },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  })

  return NextResponse.json(addresses)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
  }

  const body = await req.json()
  const { title, cityId, districtId, fullAddress, isDefault } = body

  if (!title || !cityId || !districtId || !fullAddress) {
    return NextResponse.json({ error: "Gerekli alanlar eksik" }, { status: 400 })
  }

  if (isDefault) {
    await db.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    })
  }

  const address = await db.address.create({
    data: {
      userId: session.user.id,
      title,
      cityId: parseInt(cityId),
      districtId: parseInt(districtId),
      fullAddress,
      isDefault: !!isDefault,
    },
    include: {
      city: { select: { id: true, name: true } },
      district: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(address)
}
