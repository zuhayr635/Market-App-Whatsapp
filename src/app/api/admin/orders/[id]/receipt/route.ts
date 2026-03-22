import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
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
  const { action, rejectReason, receiptId } = body

  if (!action || !receiptId) {
    return NextResponse.json({ error: "action ve receiptId gerekli" }, { status: 400 })
  }

  const order = await db.order.findUnique({ where: { id: params.id } })
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 })
  }

  if (action === "approve") {
    await db.receipt.update({
      where: { id: receiptId },
      data: { status: "APPROVED", reviewedAt: new Date() },
    })
    await db.order.update({
      where: { id: params.id },
      data: { status: "PAYMENT_CONFIRMED" },
    })
    await db.orderHistory.create({
      data: {
        orderId: params.id,
        status: "PAYMENT_CONFIRMED",
        description: "Dekont onaylandı - ödeme teyit edildi",
      },
    })

    // Deduct stock for order items
    const orderItems = await db.orderItem.findMany({ where: { orderId: params.id } })
    await Promise.all(
      orderItems.map((item) =>
        db.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        }).catch(() => {})
      )
    )

    return NextResponse.json({ success: true })
  }

  if (action === "reject") {
    await db.receipt.update({
      where: { id: receiptId },
      data: {
        status: "REJECTED",
        rejectReason: rejectReason || "Dekont reddedildi",
        reviewedAt: new Date(),
      },
    })
    await db.order.update({
      where: { id: params.id },
      data: { status: "PAYMENT_WAITING" },
    })
    await db.orderHistory.create({
      data: {
        orderId: params.id,
        status: "PAYMENT_WAITING",
        description: `Dekont reddedildi: ${rejectReason || "Geçersiz dekont"}`,
      },
    })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Geçersiz action" }, { status: 400 })
}
