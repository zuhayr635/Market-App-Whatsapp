import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function GET() {
  const pages = await db.page.findMany({ orderBy: { title: "asc" } })
  return NextResponse.json({ pages })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { title, slug, content, seoTitle, seoDesc, status } = body

  if (!title || !slug) {
    return NextResponse.json({ error: "Başlık ve slug gerekli" }, { status: 400 })
  }

  const page = await db.page.upsert({
    where: { slug },
    update: {
      title,
      content: content ?? "",
      seoTitle: seoTitle ?? null,
      seoDesc: seoDesc ?? null,
      status: status !== false,
    },
    create: {
      title,
      slug,
      content: content ?? "",
      seoTitle: seoTitle ?? null,
      seoDesc: seoDesc ?? null,
      status: status !== false,
    },
  })

  return NextResponse.json({ page }, { status: 201 })
}
