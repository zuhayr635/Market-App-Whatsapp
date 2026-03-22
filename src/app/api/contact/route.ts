import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, subject, message } = body

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Tüm alanları doldurun" }, { status: 400 })
  }

  const contact = await db.contactForm.create({
    data: { name, email, subject, message },
  })

  // Notify admin via email
  try {
    const adminEmailSetting = await db.setting.findUnique({ where: { key: "contact_email" } })
    const adminEmail = adminEmailSetting?.value
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Yeni İletişim Formu: ${subject}`,
        html: `
          <h3>Yeni iletişim formu mesajı</h3>
          <p><strong>Ad Soyad:</strong> ${name}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          <p><strong>Konu:</strong> ${subject}</p>
          <p><strong>Mesaj:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
      })
    }
  } catch {
    // email failure should not block form submission
  }

  return NextResponse.json({ success: true, id: contact.id })
}
