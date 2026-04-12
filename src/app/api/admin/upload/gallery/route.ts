import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const images = await db.productImage.findMany({
    select: { id: true, url: true, altText: true },
    orderBy: { id: "desc" },
    take: 100,
  })

  return NextResponse.json(images)
}
