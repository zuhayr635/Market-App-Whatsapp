import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const page = await db.page.findUnique({ where: { slug: params.slug } })
  if (!page) {
    return NextResponse.json({ error: "Sayfa bulunamadı" }, { status: 404 })
  }
  return NextResponse.json({ page })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { title, content, seoTitle, seoDesc, status } = body

  const existing = await db.page.findUnique({ where: { slug: params.slug } })

  if (existing) {
    const page = await db.page.update({
      where: { slug: params.slug },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDesc !== undefined && { seoDesc }),
        ...(status !== undefined && { status }),
      },
    })
    return NextResponse.json({ page })
  } else {
    // Create with slug if not exists yet
    const page = await db.page.create({
      data: {
        slug: params.slug,
        title: title ?? params.slug,
        content: content ?? "",
        seoTitle: seoTitle ?? null,
        seoDesc: seoDesc ?? null,
        status: status !== false,
      },
    })
    return NextResponse.json({ page }, { status: 201 })
  }
}
