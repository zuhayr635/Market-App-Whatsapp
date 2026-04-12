import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"

export async function POST(req: NextRequest) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "IMGBB_API_KEY tanımlı değil" },
      { status: 500 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Desteklenmeyen dosya formatı. JPG, PNG, WEBP veya GIF yükleyin." },
        { status: 400 }
      )
    }

    const maxSize = 32 * 1024 * 1024 // 32MB (imgbb limit)
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Dosya boyutu 32MB'dan büyük olamaz" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    const imgbbForm = new FormData()
    imgbbForm.append("key", apiKey)
    imgbbForm.append("image", base64)
    imgbbForm.append("name", file.name)

    const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: imgbbForm,
    })

    if (!imgbbRes.ok) {
      const err = await imgbbRes.text()
      console.error("imgbb error:", err)
      return NextResponse.json(
        { error: "Resim yükleme servisi hatası" },
        { status: 502 }
      )
    }

    const imgbbData = await imgbbRes.json()
    const url: string = imgbbData?.data?.url

    if (!url) {
      return NextResponse.json(
        { error: "Resim URL'i alınamadı" },
        { status: 502 }
      )
    }

    return NextResponse.json({
      url,
      fileName: file.name,
      size: file.size,
    })
  } catch {
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu" },
      { status: 500 }
    )
  }
}
