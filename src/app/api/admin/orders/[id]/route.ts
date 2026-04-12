import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: { id: true, name: true, surname: true, email: true, phone: true },
      },
      items: true,
      history: { orderBy: { createdAt: "asc" } },
      paymentLinks: { orderBy: { createdAt: "desc" } },
      receipts: { orderBy: { uploadedAt: "desc" } },
      shipping: {
        include: { company: true },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 })
  }

  return NextResponse.json({
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
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(req, { params })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { status, adminNote, receiptId, receiptAction, rejectReason } = body

  const order = await db.order.findUnique({ where: { id: params.id } })
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 })
  }

  // Handle receipt approve/reject
  if (receiptId && receiptAction) {
    if (receiptAction === "approve") {
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
      return NextResponse.json({ success: true })
    }

    if (receiptAction === "reject") {
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
  }

  // Update status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {}
  if (status) {
    updateData.status = status
    await db.orderHistory.create({
      data: {
        orderId: params.id,
        status,
        description: adminNote || `Durum güncellendi: ${status}`,
      },
    })
  }
  if (adminNote !== undefined) {
    updateData.adminNote = adminNote
  }

  const updated = await db.order.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json({ success: true, order: updated })
}

