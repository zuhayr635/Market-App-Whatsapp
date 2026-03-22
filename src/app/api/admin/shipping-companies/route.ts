import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const companies = await db.shippingCompany.findMany({
    where: { status: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, trackingUrl: true },
  })
  return NextResponse.json(companies)
}
