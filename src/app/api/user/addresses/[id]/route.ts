import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = await params

  const existing = await db.address.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Adres bulunamadı" }, { status: 404 })
  }

  const body = await req.json()
  const { title, cityId, districtId, fullAddress, isDefault } = body

  if (isDefault) {
    await db.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    })
  }

  const updated = await db.address.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(cityId !== undefined && { cityId: parseInt(cityId) }),
      ...(districtId !== undefined && { districtId: parseInt(districtId) }),
      ...(fullAddress !== undefined && { fullAddress }),
      ...(isDefault !== undefined && { isDefault: !!isDefault }),
    },
    include: {
      city: { select: { id: true, name: true } },
      district: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }
  const userId = session.user.id
  const { id } = await params

  const existing = await db.address.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Adres bulunamadı" }, { status: 404 })
  }

  await db.address.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
