import { db } from "@/lib/db"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const carts = await db.cart.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                priceTl: true,
                salePriceTl: true,
                images: {
                  take: 1,
                  orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
                  select: { url: true },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const result = carts
      .filter((cart) => cart.items.length > 0)
      .map((cart) => {
        const items = cart.items.map((item) => {
          const priceTl = Number(item.product.salePriceTl ?? item.product.priceTl)
          return {
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            productSlug: item.product.slug,
            productImage: item.product.images[0]?.url || null,
            quantity: item.quantity,
            unitPriceTl: priceTl,
            lineTotalTl: priceTl * item.quantity,
          }
        })
        const totalTl = items.reduce((s, i) => s + i.lineTotalTl, 0)
        return {
          cartId: cart.id,
          user: cart.user,
          itemCount: items.length,
          totalTl,
          items,
          updatedAt: cart.updatedAt,
        }
      })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
