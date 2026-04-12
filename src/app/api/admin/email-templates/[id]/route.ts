import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { subject, content, variables } = body

  const template = await db.emailTemplate.update({
    where: { id: params.id },
    data: {
      ...(subject !== undefined && { subject }),
      ...(content !== undefined && { content }),
      ...(variables !== undefined && { variables }),
    },
  })

  return NextResponse.json({ template })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const body = await req.json()
  const { action, testEmail } = body

  if (action !== "test") {
    return NextResponse.json({ error: "Geçersiz action" }, { status: 400 })
  }

  const template = await db.emailTemplate.findUnique({ where: { id: params.id } })
  if (!template) {
    return NextResponse.json({ error: "Şablon bulunamadı" }, { status: 404 })
  }

  const to = testEmail || session.user?.email
  if (!to) {
    return NextResponse.json({ error: "E-posta adresi gerekli" }, { status: 400 })
  }

  let content = template.content
  let subject = template.subject

  // Replace variables with placeholder values
  const vars = template.variables ? JSON.parse(template.variables) as string[] : []
  for (const v of vars) {
    const regex = new RegExp(`\\{${v}\\}`, "g")
    content = content.replace(regex, `[${v}]`)
    subject = subject.replace(regex, `[${v}]`)
  }

  await sendEmail({ to, subject: `[TEST] ${subject}`, html: content })

  return NextResponse.json({ success: true, sentTo: to })
}
