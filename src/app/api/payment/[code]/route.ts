import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const paymentLink = await db.paymentLink.findUnique({
    where: { linkCode: params.code },
    include: {
      order: {
        include: {
          items: true,
        },
      },
    },
  })

  if (!paymentLink) {
    return NextResponse.json({ error: "Ödeme linki bulunamadı" }, { status: 404 })
  }

  if (!paymentLink.status) {
    return NextResponse.json({ error: "Bu ödeme linki artık aktif değil" }, { status: 410 })
  }

  return NextResponse.json({
    paymentLink: {
      id: paymentLink.id,
      expiresAt: paymentLink.expiresAt,
      status: paymentLink.status,
    },
    order: {
      id: paymentLink.order.id,
      orderNo: paymentLink.order.orderNo,
      totalUsd: Number(paymentLink.order.totalUsd),
      totalTl: Number(paymentLink.order.totalTl),
      status: paymentLink.order.status,
      items: paymentLink.order.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        variationJson: i.variationJson,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    },
  })
}
