import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { seedEmailTemplates } from "@/lib/seed-email-templates"

export async function GET() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  await seedEmailTemplates()

  const templates = await db.emailTemplate.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json({ templates })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { name, subject, content, variables } = body

  if (!name || !subject || !content) {
    return NextResponse.json({ error: "name, subject ve content gerekli" }, { status: 400 })
  }

  const template = await db.emailTemplate.create({
    data: { name, subject, content, variables: variables || null },
  })

  return NextResponse.json({ template }, { status: 201 })
}
