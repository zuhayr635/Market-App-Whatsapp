import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const markRead = searchParams.get("markRead")

  if (markRead) {
    await db.notification.update({
      where: { id: markRead },
      data: { isRead: true },
    })
    return NextResponse.json({ success: true })
  }

  const notifications = await db.notification.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    take: 50,
  })

  const unreadCount = await db.notification.count({ where: { isRead: false } })

  return NextResponse.json({ notifications, unreadCount })
}

export async function DELETE() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  await db.notification.deleteMany({ where: { isRead: true } })
  return NextResponse.json({ success: true })
}
