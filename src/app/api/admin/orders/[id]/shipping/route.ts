import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { companyId, trackingNo, estimatedDate } = body

  if (!companyId || !trackingNo) {
    return NextResponse.json({ error: "Kargo firması ve takip numarası gerekli" }, { status: 400 })
  }

  const order = await db.order.findUnique({ where: { id: params.id } })
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 })
  }

  const shipping = await db.shippingInfo.upsert({
    where: { orderId: params.id },
    update: {
      companyId,
      trackingNo,
      estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
    },
    create: {
      orderId: params.id,
      companyId,
      trackingNo,
      estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
    },
  })

  await db.order.update({
    where: { id: params.id },
    data: { status: "SHIPPED" },
  })

  await db.orderHistory.create({
    data: {
      orderId: params.id,
      status: "SHIPPED",
      description: `Kargo bilgisi eklendi - Takip No: ${trackingNo}`,
    },
  })

  return NextResponse.json({ success: true, shipping })
}
