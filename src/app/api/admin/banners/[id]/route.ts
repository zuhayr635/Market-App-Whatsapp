import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { title, subtitle, image, mediaType, buttonText, buttonLink, startDate, endDate, sortOrder, status, position, duration } = body

  const banner = await db.banner.update({
    where: { id: params.id },
    data: {
      title: title !== undefined ? title || null : undefined,
      subtitle: subtitle !== undefined ? subtitle || null : undefined,
      image: image || undefined,
      mediaType: mediaType || undefined,
      buttonText: buttonText !== undefined ? buttonText || null : undefined,
      buttonLink: buttonLink !== undefined ? buttonLink || null : undefined,
      startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      status: status !== undefined ? Boolean(status) : undefined,
      position: position || undefined,
      duration: duration !== undefined ? Number(duration) : undefined,
    },
  })

  return NextResponse.json(banner)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  await db.banner.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
