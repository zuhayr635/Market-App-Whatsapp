import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { createNotification } from "@/lib/notify"
import type Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (!orderId) {
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        status: "STRIPE_PAID",
        stripePaymentStatus: session.payment_status,
      },
    })

    await db.orderHistory.create({
      data: {
        orderId,
        status: "STRIPE_PAID",
        description: `Stripe ödeme başarılı - Session: ${session.id}`,
      },
    })

    await createNotification(
      "stripe_payment",
      "Stripe Ödeme Alındı",
      `${order.orderNo} siparişi için Stripe ödemesi tamamlandı`,
      `/admin/siparisler/${orderId}`
    ).catch(() => {})
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (orderId) {
      const order = await db.order.findUnique({ where: { id: orderId } })
      if (order && order.status === "PENDING") {
        await db.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        })
        await db.orderHistory.create({
          data: {
            orderId,
            status: "CANCELLED",
            description: "Stripe ödeme süresi doldu - Sipariş iptal edildi",
          },
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
