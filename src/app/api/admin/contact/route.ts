import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "20", 10)
  const skip = (page - 1) * limit

  const [forms, total] = await Promise.all([
    db.contactForm.findMany({
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    db.contactForm.count(),
  ])

  return NextResponse.json({ forms, total, page, limit })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { id, isRead, isReplied } = body

  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 })
  }

  const form = await db.contactForm.update({
    where: { id },
    data: {
      ...(isRead !== undefined && { isRead }),
      ...(isReplied !== undefined && { isReplied }),
    },
  })

  return NextResponse.json({ form })
}
