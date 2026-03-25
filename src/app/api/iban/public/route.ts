export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const ibans = await db.ibanInfo.findMany({
    where: { status: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      bankName: true,
      bankLogo: true,
      iban: true,
      accountHolder: true,
      branchCode: true,
      currency: true,
    },
  })
  return NextResponse.json(ibans)
}
