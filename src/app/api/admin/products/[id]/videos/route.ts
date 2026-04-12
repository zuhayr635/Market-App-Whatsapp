import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

// GET — list product videos ordered by sortOrder
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const { id } = await params
    const videos = await db.productVideo.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(videos)
  } catch {
    return NextResponse.json(
      { error: "Videolar yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// POST — add video to product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { url, type, title, thumbnail, sortOrder } = body

    if (!url) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 })
    }

    const video = await db.productVideo.create({
      data: {
        productId: id,
        url,
        type: type || "youtube",
        title: title || null,
        thumbnail: thumbnail || null,
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json(video)
  } catch {
    return NextResponse.json(
      { error: "Video eklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// DELETE — delete a video (?videoId=xxx)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const videoId = searchParams.get("videoId")

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId parametresi gerekli" },
        { status: 400 }
      )
    }

    const video = await db.productVideo.findFirst({
      where: { id: videoId, productId: id },
    })

    if (!video) {
      return NextResponse.json(
        { error: "Video bulunamadı" },
        { status: 404 }
      )
    }

    await db.productVideo.delete({ where: { id: videoId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Video silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
