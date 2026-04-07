export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// GET: user's cart with items
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session.user as any).type === "admin") {
    return NextResponse.json({ items: [], totalUsd: 0, totalTl: 0 })
  }

  const [cart, rateSetting] = await Promise.all([
    db.cart.findUnique({
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
    }),
    db.setting.findUnique({ where: { key: "usd_rate" } }),
  ])

  const usdRate = rateSetting ? Number(rateSetting.value) : 1

  if (!cart) {
    return NextResponse.json({ items: [], totalUsd: 0, totalTl: 0 })
  }

  const items = cart.items.map((item) => {
    const variation = item.variationId
      ? item.product.variations.find((v) => v.id === item.variationId)
      : null

    const priceUsd = variation?.salePrice
      ? Number(variation.salePrice)
      : Number(item.product.salePriceUsd ?? item.product.priceUsd) +
        (variation?.priceDiff ? Number(variation.priceDiff) : 0)
    const priceTl = priceUsd * usdRate

    return {
      id: item.id,
      productId: item.productId,
      variationId: item.variationId,
      quantity: item.quantity,
      unitPriceUsd: priceUsd,
      unitPriceTl: priceTl,
      lineTotalUsd: priceUsd * item.quantity,
      lineTotalTl: priceTl * item.quantity,
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
            combination: variation.combination,
            stock: variation.stock,
            imageUrl: variation.imageUrl,
          }
        : null,
    }
  })

  const totalUsd = items.reduce((sum, item) => sum + item.lineTotalUsd, 0)
  const totalTl = items.reduce((sum, item) => sum + item.lineTotalTl, 0)

  return NextResponse.json({ items, totalUsd, totalTl })
}

// POST: add item to cart
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
  }
  // Admin users don't have a cart in the users table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session.user as any).type === "admin") {
    return NextResponse.json({ error: "Admin kullanıcılar sepet kullanamaz" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { productId, variationId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json({ error: "Ürün ID gerekli" }, { status: 400 })
    }

    // Validate product exists and is published
    const product = await db.product.findUnique({
      where: { id: productId, status: "PUBLISHED" },
    })

    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 })
    }

    // Get or create cart
    let cart = await db.cart.findUnique({ where: { userId: session.user.id } })
    if (!cart) {
      cart = await db.cart.create({ data: { userId: session.user.id } })
    }

    // Check if item already in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variationId: variationId || null,
      },
    })

    const unitPrice = product.salePriceUsd ?? product.priceUsd

    if (existingItem) {
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      })
    } else {
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variationId: variationId || null,
          quantity,
          unitPrice,
        },
      })
    }

    // Return updated cart count
    const count = await db.cartItem.count({ where: { cartId: cart.id } })
    return NextResponse.json({ success: true, cartItemCount: count })
  } catch (error) {
    console.error("Cart POST error:", error)
    return NextResponse.json({ error: "Sepete eklenirken bir hata oluştu" }, { status: 500 })
  }
}

// PUT: update item quantity
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
  }

  const body = await req.json()
  const { itemId, quantity } = body

  if (!itemId || quantity < 1) {
    return NextResponse.json({ error: "Geçersiz parametreler" }, { status: 400 })
  }

  // Verify ownership
  const item = await db.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  })

  if (!item || item.cart.userId !== session.user.id) {
    return NextResponse.json({ error: "Öğe bulunamadı" }, { status: 404 })
  }

  await db.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  })

  return NextResponse.json({ success: true })
}

// DELETE: remove item or clear cart
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get("itemId")
  const clearAll = searchParams.get("clearAll")

  const cart = await db.cart.findUnique({ where: { userId: session.user.id } })
  if (!cart) {
    return NextResponse.json({ error: "Sepet bulunamadı" }, { status: 404 })
  }

  if (clearAll === "true") {
    await db.cartItem.deleteMany({ where: { cartId: cart.id } })
    return NextResponse.json({ success: true })
  }

  if (itemId) {
    const item = await db.cartItem.findUnique({ where: { id: itemId } })
    if (!item || item.cartId !== cart.id) {
      return NextResponse.json({ error: "Öğe bulunamadı" }, { status: 404 })
    }
    await db.cartItem.delete({ where: { id: itemId } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "itemId veya clearAll gerekli" }, { status: 400 })
}
