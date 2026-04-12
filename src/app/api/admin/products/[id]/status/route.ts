import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { ProductStatus } from "@/generated/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = params
    const body = await request.json()
    const { status } = body

    if (!status || !Object.values(ProductStatus).includes(status as ProductStatus)) {
      return NextResponse.json(
        { error: "Geçersiz durum değeri" },
        { status: 400 }
      )
    }

    const product = await db.product.findUnique({ where: { id } })
    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      )
    }

    const updated = await db.product.update({
      where: { id },
      data: { status: status as ProductStatus },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Product status PATCH error:", error)
    return NextResponse.json(
      { error: "Durum güncellenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
