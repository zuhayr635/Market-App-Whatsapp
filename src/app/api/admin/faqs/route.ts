import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

export async function GET() {
  const faqs = await db.faq.findMany({ orderBy: { sortOrder: "asc" } })
  return NextResponse.json({ faqs })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { question, answer, sortOrder, status } = body

  if (!question || !answer) {
    return NextResponse.json({ error: "Soru ve cevap gerekli" }, { status: 400 })
  }

  const faq = await db.faq.create({
    data: {
      question,
      answer,
      sortOrder: sortOrder ?? 0,
      status: status !== false,
    },
  })

  return NextResponse.json({ faq }, { status: 201 })
}
