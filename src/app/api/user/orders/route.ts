import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
  }

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        select: { id: true, productName: true, quantity: true, unitPrice: true, totalPrice: true },
      },
      shipping: { include: { company: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(
    orders.map((o) => ({
      ...o,
      totalUsd: Number(o.totalUsd),
      totalTl: Number(o.totalTl),
      items: o.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
    }))
  )
}
