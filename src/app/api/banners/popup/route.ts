export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const now = new Date()
  const popup = await db.banner.findFirst({
    where: {
      status: true,
      position: "popup",
      OR: [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: { gte: now } },
      ],
    },
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json({ popup })
}
