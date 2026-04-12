import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const types = await db.variationType.findMany({
      include: {
        values: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(types)
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const body = await req.json()
    const { name, displayType, sortOrder, status, values } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Varyasyon tipi adı zorunludur" },
        { status: 400 }
      )
    }

    const variationType = await db.variationType.create({
      data: {
        name: name.trim(),
        displayType: displayType || "dropdown",
        sortOrder: sortOrder ?? 0,
        status: status ?? true,
        values: {
          create: Array.isArray(values)
            ? values.map(
                (
                  v: {
                    value: string
                    colorCode?: string
                    image?: string
                    sortOrder?: number
                  },
                  i: number
                ) => ({
                  value: v.value,
                  colorCode: v.colorCode || null,
                  image: v.image || null,
                  sortOrder: v.sortOrder ?? i,
                })
              )
            : [],
        },
      },
      include: {
        values: { orderBy: { sortOrder: "asc" } },
      },
    })

    return NextResponse.json(variationType, { status: 201 })
  } catch (error) {
    console.error("VariationType POST error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
