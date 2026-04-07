export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCached } from "@/lib/cache"

// Public keys that are safe to expose without auth
const PUBLIC_KEYS = [
  "contact_phone",
  "contact_email",
  "contact_address",
  "working_hours",
  "whatsapp_number",
  "whatsapp_template",
  "whatsapp_float_enabled",
  "map_lat",
  "map_lng",
  "site_name",
  "site_description",
]

export async function GET() {
  const settings = await getCached("publicSettings", 60_000, async () => {
    const rows = await db.setting.findMany({
      where: { key: { in: PUBLIC_KEYS } },
    })
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    return map
  }).catch(() => ({} as Record<string, string>))

  return NextResponse.json({ settings: Object.entries(settings).map(([key, value]) => ({ key, value })) })
}
