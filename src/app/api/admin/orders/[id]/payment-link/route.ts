import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const order = await db.order.findUnique({ where: { id: params.id } })
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 })
  }

  const linkCode = randomBytes(16).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const paymentLink = await db.paymentLink.create({
    data: {
      orderId: params.id,
      linkCode,
      expiresAt,
    },
  })

  // Update order status
  await db.order.update({
    where: { id: params.id },
    data: { status: "IBAN_SENT" },
  })

  await db.orderHistory.create({
    data: {
      orderId: params.id,
      status: "IBAN_SENT",
      description: "Ödeme linki oluşturuldu ve gönderildi",
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const paymentUrl = `${baseUrl}/odeme/${linkCode}`

  return NextResponse.json({
    success: true,
    paymentLink: {
      ...paymentLink,
      url: paymentUrl,
    },
  })
}
