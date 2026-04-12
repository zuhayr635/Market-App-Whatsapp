import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

// GET — list product files
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const { id } = await params
    const files = await db.productFile.findMany({
      where: { productId: id },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json(files)
  } catch {
    return NextResponse.json(
      { error: "Dosyalar yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// POST — add file to product
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
    const { url, fileName, fileSize, downloadable } = body

    if (!url) {
      return NextResponse.json({ error: "URL gerekli" }, { status: 400 })
    }
    if (!fileName) {
      return NextResponse.json({ error: "Dosya adı gerekli" }, { status: 400 })
    }

    const file = await db.productFile.create({
      data: {
        productId: id,
        url,
        fileName,
        fileSize: fileSize ?? 0,
        downloadable: downloadable ?? true,
      },
    })

    return NextResponse.json(file)
  } catch {
    return NextResponse.json(
      { error: "Dosya eklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// DELETE — delete a file (?fileId=xxx)
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
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId parametresi gerekli" },
        { status: 400 }
      )
    }

    const file = await db.productFile.findFirst({
      where: { id: fileId, productId: id },
    })

    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadı" },
        { status: 404 }
      )
    }

    await db.productFile.delete({ where: { id: fileId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Dosya silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
