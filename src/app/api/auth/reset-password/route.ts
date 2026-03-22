import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || typeof token !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 })
    }

    const setting = await db.setting.findUnique({
      where: { key: `pwd_reset_${token}` },
    })

    if (!setting) {
      return NextResponse.json(
        { message: "Geçersiz veya süresi dolmuş bağlantı." },
        { status: 400 }
      )
    }

    const [email, expiryStr] = setting.value.split("|")
    const expiry = parseInt(expiryStr, 10)

    if (isNaN(expiry) || Date.now() > expiry) {
      // Clean up expired token
      await db.setting.delete({ where: { key: `pwd_reset_${token}` } })
      return NextResponse.json(
        { message: "Şifre sıfırlama bağlantısının süresi dolmuş." },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { message: "Kullanıcı bulunamadı." },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    await db.setting.delete({ where: { key: `pwd_reset_${token}` } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[RESET_PASSWORD]", err)
    return NextResponse.json({ message: "Bir hata oluştu." }, { status: 500 })
  }
}
