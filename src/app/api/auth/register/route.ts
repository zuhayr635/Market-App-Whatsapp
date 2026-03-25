import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { registerSchema } from "@/lib/validations/auth"
import { verifyCaptcha } from "@/lib/captcha"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Honeypot kontrolü — botlar bu alanı doldurur
    if (body._hp && body._hp.trim() !== "") {
      return NextResponse.json({ message: "Gecersiz istek" }, { status: 400 })
    }

    // CAPTCHA doğrulama
    const { captchaToken, captchaAnswer, captchaSig } = body
    if (!captchaToken || !captchaAnswer || !captchaSig) {
      return NextResponse.json({ message: "CAPTCHA gerekli" }, { status: 400 })
    }
    if (!verifyCaptcha(captchaToken, captchaAnswer, captchaSig)) {
      return NextResponse.json({ message: "CAPTCHA yanlis veya suresi dolmus" }, { status: 400 })
    }

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".")
        if (!fieldErrors[field]) fieldErrors[field] = []
        fieldErrors[field].push(issue.message)
      }
      return NextResponse.json(
        { message: "Gecersiz bilgiler", errors: fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "Bu e-posta adresi zaten kayitli" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    await db.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        email: data.email,
        phone: data.phone,
        cityId: parseInt(data.cityId),
        districtId: parseInt(data.districtId),
        address: data.address,
        passwordHash,
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { message: "Sunucu hatasi" },
      { status: 500 }
    )
  }
}
