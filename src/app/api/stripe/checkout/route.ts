import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

function generateOrderNo(): string {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "")
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `SIP-${dateStr}-${rand}`
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
  }

  const body = await req.json()
  const { addressId, orderNote, couponCode, discountAmount } = body

  // Get cart with items
  const cart = await db.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                take: 1,
                orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
              },
              variations: { where: { status: true } },
            },
          },
        },
      },
    },
  })

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Sepetiniz boş" }, { status: 400 })
  }

  // Build address JSON
  let addressJson = null
  if (addressId) {
    const address = await db.address.findUnique({
      where: { id: addressId },
      include: { city: true, district: true },
    })
    if (address) {
      addressJson = {
        title: address.title,
        fullAddress: address.fullAddress,
        city: address.city.name,
        district: address.district.name,
      }
    }
  }

  // Calculate totals and build Stripe line items
  let totalUsd = 0
  let totalTl = 0
  const stripeLineItems: {
    price_data: {
      currency: string
      product_data: { name: string; images?: string[] }
      unit_amount: number
    }
    quantity: number
  }[] = []
  const orderItems: {
    productId: string
    productName: string
    variationJson?: Record<string, string>
    quantity: number
    unitPrice: number
    totalPrice: number
  }[] = []

  for (const item of cart.items) {
    const variation = item.variationId
      ? item.product.variations.find((v) => v.id === item.variationId)
      : null

    const priceUsd =
      Number(item.product.salePriceUsd ?? item.product.priceUsd) +
      (variation?.priceDiff ? Number(variation.priceDiff) : 0)
    const priceTl =
      Number(item.product.salePriceTl ?? item.product.priceTl) +
      (variation?.priceDiff ? Number(variation.priceDiff) : 0)

    totalUsd += priceUsd * item.quantity
    totalTl += priceTl * item.quantity

    const productName = variation
      ? `${item.product.name} (${Object.values(variation.combination as Record<string, string>).join(", ")})`
      : item.product.name

    const imageUrl = item.product.images[0]?.url
    const stripeItem: (typeof stripeLineItems)[number] = {
      price_data: {
        currency: "try",
        product_data: {
          name: productName,
          ...(imageUrl && imageUrl.startsWith("http") ? { images: [imageUrl] } : {}),
        },
        unit_amount: Math.round(priceTl * 100), // Stripe uses kuruş (smallest unit)
      },
      quantity: item.quantity,
    }
    stripeLineItems.push(stripeItem)

    orderItems.push({
      productId: item.productId,
      productName: item.product.name,
      variationJson: variation
        ? (variation.combination as Record<string, string>)
        : undefined,
      quantity: item.quantity,
      unitPrice: priceUsd,
      totalPrice: priceUsd * item.quantity,
    })
  }

  const discount = discountAmount ? Number(discountAmount) : 0
  const finalTotalTl = Math.max(0, totalTl - discount)
  const orderNo = generateOrderNo()

  // Create order in DB
  const order = await db.order.create({
    data: {
      orderNo,
      userId: session.user.id,
      status: "PENDING",
      totalUsd,
      totalTl: finalTotalTl,
      addressJson: addressJson || undefined,
      orderNote: orderNote || null,
      couponCode: couponCode || null,
      discountAmount: discount > 0 ? discount : null,
      items: { create: orderItems },
      history: {
        create: {
          status: "PENDING",
          description: "Sipariş oluşturuldu - Stripe ödeme başlatıldı",
        },
      },
    },
  })

  // Apply coupon usedCount
  if (couponCode) {
    await db.coupon
      .updateMany({
        where: { code: couponCode.toUpperCase() },
        data: { usedCount: { increment: 1 } },
      })
      .catch(() => {})
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"

  // Add coupon discount as line item if applicable
  const discounts: { coupon: string }[] = []
  if (discount > 0) {
    try {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(discount * 100),
        currency: "try",
        duration: "once",
        name: couponCode ? `Kupon: ${couponCode}` : "İndirim",
      })
      discounts.push({ coupon: stripeCoupon.id })
    } catch {
      // If coupon creation fails, adjust first line item price instead
    }
  }

  // Create Stripe Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: stripeLineItems,
    mode: "payment",
    success_url: `${baseUrl}/odeme/basarili?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    cancel_url: `${baseUrl}/odeme/iptal?order_id=${order.id}`,
    metadata: {
      orderId: order.id,
      orderNo: order.orderNo,
    },
    ...(discounts.length > 0 ? { discounts } : {}),
  })

  // Save stripeSessionId to order
  await db.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkoutSession.id },
  })

  // Clear cart
  await db.cartItem.deleteMany({ where: { cartId: cart.id } })

  return NextResponse.json({ url: checkoutSession.url })
}
