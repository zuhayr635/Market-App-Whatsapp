export const dynamic = 'force-dynamic'

import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cities = await db.city.findMany({
      orderBy: { plateCode: "asc" },
      where: { status: true },
    })
    return NextResponse.json(cities)
  } catch (error) {
    console.error("Cities fetch error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
