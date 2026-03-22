import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadi" },
        { status: 400 }
      )
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Desteklenmeyen dosya formati. JPG, PNG, WEBP veya GIF yukleyin." },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Dosya boyutu 5MB'dan buyuk olamaz" },
        { status: 400 }
      )
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const uploadDir = path.join(process.cwd(), "public/uploads/products")

    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(path.join(uploadDir, fileName), buffer)

    return NextResponse.json({
      url: `/uploads/products/${fileName}`,
      fileName: file.name,
      size: file.size,
    })
  } catch {
    return NextResponse.json(
      { error: "Dosya yuklenirken bir hata olustu" },
      { status: 500 }
    )
  }
}
