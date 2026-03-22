import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    // Always return 200 to avoid revealing whether the email exists
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomUUID()
    const expiry = Date.now() + 60 * 60 * 1000 // 1 hour

    await db.setting.create({
      data: {
        key: `pwd_reset_${token}`,
        value: `${email}|${expiry}`,
        group: "reset",
      },
    })

    const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetLink = `${siteUrl}/sifre-sifirla?token=${token}`

    await sendEmail({
      to: email,
      subject: "Şifre Sıfırlama",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b45309;">Şifre Sıfırlama</h2>
          <p>Merhaba,</p>
          <p>Hesabınız için bir şifre sıfırlama talebinde bulunuldu.</p>
          <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
          <p style="margin: 24px 0;">
            <a
              href="${resetLink}"
              style="background-color: #b45309; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;"
            >
              Şifremi Sıfırla
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Bu bağlantı 1 saat geçerlidir.</p>
          <p style="color: #666; font-size: 14px;">Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[FORGOT_PASSWORD]", err)
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 })
  }
}
