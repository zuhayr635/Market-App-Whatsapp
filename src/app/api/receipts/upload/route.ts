import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { createNotification } from "@/lib/notify"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const orderId = formData.get("orderId") as string
  const payerName = formData.get("payerName") as string | null
  const paymentDate = formData.get("paymentDate") as string | null
  const amount = formData.get("amount") as string | null
  const note = formData.get("note") as string | null

  if (!file || !orderId) {
    return NextResponse.json({ error: "Dosya ve sipariş ID gerekli" }, { status: 400 })
  }

  // Verify order exists
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 })
  }

  // Save file
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadsDir = path.join(process.cwd(), "public", "uploads", "receipts")
  await mkdir(uploadsDir, { recursive: true })

  const ext = path.extname(file.name) || ".png"
  const fileName = `receipt-${orderId}-${Date.now()}${ext}`
  const filePath = path.join(uploadsDir, fileName)

  await writeFile(filePath, buffer)

  const fileUrl = `/uploads/receipts/${fileName}`

  // Create receipt record
  const receipt = await db.receipt.create({
    data: {
      orderId,
      fileUrl,
      payerName: payerName || null,
      paymentDate: paymentDate ? new Date(paymentDate) : null,
      amount: amount ? parseFloat(amount) : null,
      note: note || null,
      status: "PENDING",
    },
  })

  // Update order status
  await db.order.update({
    where: { id: orderId },
    data: { status: "RECEIPT_UPLOADED" },
  })

  await db.orderHistory.create({
    data: {
      orderId,
      status: "RECEIPT_UPLOADED",
      description: "Ödeme dekontu yüklendi - onay bekleniyor",
    },
  })

  // Create admin notification
  await createNotification(
    "new_receipt",
    "Dekont Yüklendi",
    `${order.orderNo} numaralı sipariş için ödeme dekontu yüklendi`,
    `/admin/siparisler/${orderId}`
  )

  return NextResponse.json({ success: true, receipt })
}
