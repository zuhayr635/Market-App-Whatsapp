import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { clearCache } from "@/lib/cache"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const settings = await db.setting.findMany({ orderBy: { group: "asc" } })

  // Group by group
  const grouped: Record<string, Record<string, string>> = {}
  for (const s of settings) {
    if (!grouped[s.group]) grouped[s.group] = {}
    grouped[s.group][s.key] = s.value
  }

  return NextResponse.json({ settings, grouped })
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const updates: Record<string, string> = body

  const upserts = Object.entries(updates).map(([key, value]) =>
    db.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), group: "general" },
    })
  )

  await Promise.all(upserts)
  clearCache("siteSettings")
  clearCache("publicSettings")
  clearCache("contactSettings")

  return NextResponse.json({ success: true })
}
