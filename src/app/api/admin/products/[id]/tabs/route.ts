import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

// GET — list product tabs ordered by sortOrder
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const { id } = await params
    const tabs = await db.productTab.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(tabs)
  } catch {
    return NextResponse.json(
      { error: "Sekmeler yüklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// POST — add tab to product
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
    const { title, content, icon, sortOrder } = body

    if (!title) {
      return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 })
    }
    if (!content) {
      return NextResponse.json({ error: "İçerik gerekli" }, { status: 400 })
    }

    const tab = await db.productTab.create({
      data: {
        productId: id,
        title,
        content,
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
        status: true,
      },
    })

    return NextResponse.json(tab)
  } catch {
    return NextResponse.json(
      { error: "Sekme eklenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// PATCH — update a tab
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { tabId, title, content, sortOrder, status } = body

    if (!tabId) {
      return NextResponse.json(
        { error: "tabId gerekli" },
        { status: 400 }
      )
    }

    const existing = await db.productTab.findFirst({
      where: { id: tabId, productId: id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Sekme bulunamadı" },
        { status: 404 }
      )
    }

    const tab = await db.productTab.update({
      where: { id: tabId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json(tab)
  } catch {
    return NextResponse.json(
      { error: "Sekme güncellenirken hata oluştu" },
      { status: 500 }
    )
  }
}

// DELETE — delete a tab (?tabId=xxx)
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
    const tabId = searchParams.get("tabId")

    if (!tabId) {
      return NextResponse.json(
        { error: "tabId parametresi gerekli" },
        { status: 400 }
      )
    }

    const tab = await db.productTab.findFirst({
      where: { id: tabId, productId: id },
    })

    if (!tab) {
      return NextResponse.json(
        { error: "Sekme bulunamadı" },
        { status: 404 }
      )
    }

    await db.productTab.delete({ where: { id: tabId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Sekme silinirken hata oluştu" },
      { status: 500 }
    )
  }
}
