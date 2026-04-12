import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function GET(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "orders"
  const days = parseInt(searchParams.get("days") || "30")

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (days - 1))
  startDate.setHours(0, 0, 0, 0)

  if (type === "orders") {
    const orders = await db.order.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    // Build day map
    const dayMap: Record<string, number> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      dayMap[key] = 0
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10)
      if (key in dayMap) dayMap[key]++
    }

    const data = Object.entries(dayMap).map(([date, count]) => ({ date, count }))
    return NextResponse.json(data)
  }

  if (type === "revenue") {
    const orders = await db.order.findMany({
      where: {
        status: "PAYMENT_CONFIRMED",
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, totalUsd: true },
      orderBy: { createdAt: "asc" },
    })

    const dayMap: Record<string, number> = {}
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      dayMap[key] = 0
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10)
      if (key in dayMap) {
        dayMap[key] = Math.round((dayMap[key] + Number(o.totalUsd)) * 100) / 100
      }
    }

    const data = Object.entries(dayMap).map(([date, revenue]) => ({ date, revenue }))
    return NextResponse.json(data)
  }

  if (type === "products") {
    const items = await db.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    })

    const productIds = items.map((i) => i.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    })

    const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

    const data = items.map((item) => ({
      productId: item.productId,
      name: productMap[item.productId]?.name || "Silinmiş Ürün",
      sku: productMap[item.productId]?.sku || "",
      totalQty: item._sum.quantity || 0,
    }))

    return NextResponse.json(data)
  }

  return NextResponse.json({ error: "Geçersiz rapor tipi" }, { status: 400 })
}
