export const dynamic = 'force-dynamic'

import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cityId: string }> }
) {
  try {
    const { cityId } = await params
    const districts = await db.district.findMany({
      where: { cityId: parseInt(cityId), status: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(districts)
  } catch (error) {
    console.error("Districts fetch error:", error)
    return NextResponse.json([], { status: 500 })
  }
}
