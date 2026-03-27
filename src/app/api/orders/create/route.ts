import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { buildWhatsAppMessage, type CartItem } from "@/lib/cart"
import { createNotification } from "@/lib/notify"

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
  const { addressId, orderNote, addressText, couponCode, discountAmount } = body

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

  // Calculate totals and build items
  let totalUsd = 0
  let totalTl = 0
  const cartItemsForMsg: CartItem[] = []

  const orderItems = cart.items.map((item) => {
    const variation = item.variationId
      ? item.product.variations.find((v) => v.id === item.variationId)
      : null

    const priceUsd = Number(item.product.salePriceUsd ?? item.product.priceUsd) +
      (variation?.priceDiff ? Number(variation.priceDiff) : 0)
    const priceTl = Number(item.product.salePriceTl ?? item.product.priceTl) +
      (variation?.priceDiff ? Number(variation.priceDiff) : 0)

    const lineUsd = priceUsd * item.quantity
    const lineTl = priceTl * item.quantity
    totalUsd += lineUsd
    totalTl += lineTl

    cartItemsForMsg.push({
      id: item.id,
      productId: item.productId,
      variationId: item.variationId,
      quantity: item.quantity,
      unitPriceUsd: priceUsd,
      unitPriceTl: priceTl,
      lineTotalUsd: lineUsd,
      lineTotalTl: lineTl,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        image: item.product.images[0]?.url || null,
        stockQty: item.product.stockQty,
        status: item.product.status,
      },
      variation: variation
        ? {
            id: variation.id,
            combination: variation.combination as Record<string, string>,
            stock: variation.stock,
            imageUrl: variation.imageUrl,
          }
        : null,
    })

    return {
      productId: item.productId,
      productName: item.product.name,
      variationJson: variation
        ? (variation.combination as Record<string, string>)
        : undefined,
      quantity: item.quantity,
      unitPrice: priceUsd,
      totalPrice: lineUsd,
    }
  })

  const orderNo = generateOrderNo()

  // Apply coupon discount to TL total
  const discount = discountAmount ? Number(discountAmount) : 0
  const finalTotalTl = Math.max(0, totalTl - discount)

  // Create order
  const order = await db.order.create({
    data: {
      orderNo,
      userId: session.user.id,
      status: "PENDING",
      totalUsd,
      totalTl: finalTotalTl,
      addressJson: addressJson || undefined,
      orderNote: orderNote || null,
      items: {
        create: orderItems,
      },
      history: {
        create: {
          status: "PENDING",
          description: "Sipariş oluşturuldu - WhatsApp üzerinden gönderildi",
        },
      },
    },
  })

  // Increment coupon usedCount
  if (couponCode) {
    await db.coupon.updateMany({
      where: { code: couponCode.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    }).catch(() => {})
  }

  // Clear cart
  await db.cartItem.deleteMany({ where: { cartId: cart.id } })

  // Create admin notification
  await createNotification(
    "new_order",
    "Yeni Sipariş",
    `${orderNo} numaralı yeni sipariş oluşturuldu`,
    `/admin/siparisler/${order.id}`
  )

  // Build WhatsApp message
  const message = buildWhatsAppMessage(
    cartItemsForMsg,
    totalUsd,
    finalTotalTl,
    addressText,
    orderNote,
    orderNo,
    couponCode ? { code: couponCode, discount } : undefined,
  )

  // Get WhatsApp number from settings
  let whatsappNumber = ""
  try {
    const setting = await db.setting.findUnique({ where: { key: "whatsapp_number" } })
    if (setting) whatsappNumber = setting.value.replace(/\D/g, "")
  } catch {
    // silently fail
  }

  if (!whatsappNumber) {
    return NextResponse.json(
      { error: "WhatsApp numarası ayarlanmamış. Lütfen admin panelinden ayarlayın." },
      { status: 500 }
    )
  }

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

  return NextResponse.json({
    orderId: order.id,
    orderNo: order.orderNo,
    whatsappUrl,
  })
}
