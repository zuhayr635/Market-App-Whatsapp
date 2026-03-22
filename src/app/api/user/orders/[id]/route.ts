import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
  }

  const order = await db.order.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      items: true,
      history: { orderBy: { createdAt: "asc" } },
      paymentLinks: { where: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
      receipts: { orderBy: { uploadedAt: "desc" } },
      shipping: { include: { company: true } },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 })
  }

  return NextResponse.json({
    ...order,
    totalUsd: Number(order.totalUsd),
    totalTl: Number(order.totalTl),
    items: order.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
    receipts: order.receipts.map((r) => ({
      ...r,
      amount: r.amount ? Number(r.amount) : null,
    })),
  })
}
