import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { registerSchema } from "@/lib/validations/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()

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
