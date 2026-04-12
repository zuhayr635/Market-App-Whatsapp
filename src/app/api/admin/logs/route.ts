import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function GET(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || ""
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")

  const where = search
    ? {
        OR: [
          { action: { contains: search } },
          { detail: { contains: search } },
        ],
      }
    : {}

  const [logs, total] = await Promise.all([
    db.adminLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        detail: true,
        ip: true,
        createdAt: true,
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.adminLog.count({ where }),
  ])

  return NextResponse.json({ logs, total, page, limit })
}
