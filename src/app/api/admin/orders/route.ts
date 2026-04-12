import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const search = searchParams.get("search")
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (status && status !== "ALL") {
    where.status = status
  }

  if (search) {
    where.OR = [
      { orderNo: { contains: search } },
      { user: { name: { contains: search } } },
      { user: { surname: { contains: search } } },
      { user: { email: { contains: search } } },
    ]
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, surname: true, email: true, phone: true } },
        items: true,
        receipts: { orderBy: { uploadedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.order.count({ where }),
  ])

  const serialized = orders.map((order) => ({
    ...order,
    totalTl: Number(order.totalTl),
    totalUsd: Number(order.totalUsd),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    receipts: order.receipts.map((r) => ({
      ...r,
      amount: r.amount ? Number(r.amount) : null,
    })),
  }))

  return NextResponse.json({
    orders: serialized,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
