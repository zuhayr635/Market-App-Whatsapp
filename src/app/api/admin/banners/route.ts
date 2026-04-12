import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const banners = await db.banner.findMany({
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json(banners)
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { title, subtitle, image, mediaType, buttonText, buttonLink, startDate, endDate, sortOrder, status, position, duration } = body

  if (!image) {
    return NextResponse.json({ error: "Görsel URL zorunludur" }, { status: 400 })
  }

  const banner = await db.banner.create({
    data: {
      title: title || null,
      subtitle: subtitle || null,
      image,
      buttonText: buttonText || null,
      buttonLink: buttonLink || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      status: status !== undefined ? Boolean(status) : true,
      position: position || "homepage",
      mediaType: mediaType || "image",
      duration: duration !== undefined ? Number(duration) : 5,
    },
  })

  return NextResponse.json(banner, { status: 201 })
}
