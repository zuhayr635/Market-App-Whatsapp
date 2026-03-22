import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  let dbStatus = "ok"
  try {
    await db.$queryRaw`SELECT 1`
  } catch {
    dbStatus = "error"
  }

  const status = dbStatus === "ok" ? "ok" : "degraded"
  return NextResponse.json(
    {
      status,
      db: dbStatus,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
    { status: status === "ok" ? 200 : 503 }
  )
}
