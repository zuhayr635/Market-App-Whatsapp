import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  const companies = await db.shippingCompany.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, trackingUrl: true },
  })
  return NextResponse.json(companies)
}
