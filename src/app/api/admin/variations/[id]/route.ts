import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

async function checkAdmin() {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return session?.user && (session.user as any).type === "admin"
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = params
    const body = await req.json()
    const { name, displayType, sortOrder, status, values } = body

    const existing = await db.variationType.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Varyasyon tipi bulunamadı" },
        { status: 404 }
      )
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Varyasyon tipi adı zorunludur" },
        { status: 400 }
      )
    }

    const result = await db.$transaction(async (tx) => {
      // Update the variation type
      await tx.variationType.update({
        where: { id },
        data: {
          name: name.trim(),
          displayType: displayType ?? existing.displayType,
          sortOrder: sortOrder ?? existing.sortOrder,
          status: status ?? existing.status,
        },
      })

      // Sync values if provided
      if (Array.isArray(values)) {
        const existingValues = await tx.variationValue.findMany({
          where: { variationTypeId: id },
        })
        const existingIds = new Set(existingValues.map((v) => v.id))
        const incomingIds = new Set(
          values.filter((v: { id?: string }) => v.id).map((v: { id?: string }) => v.id)
        )

        // Delete removed values
        const toDelete = Array.from(existingIds).filter((eid) => !incomingIds.has(eid))
        if (toDelete.length > 0) {
          await tx.variationValue.deleteMany({
            where: { id: { in: toDelete } },
          })
        }

        // Upsert values
        for (const v of values as Array<{
          id?: string
          value: string
          colorCode?: string
          image?: string
          sortOrder?: number
        }>) {
          if (v.id && existingIds.has(v.id)) {
            await tx.variationValue.update({
              where: { id: v.id },
              data: {
                value: v.value,
                colorCode: v.colorCode || null,
                image: v.image || null,
                sortOrder: v.sortOrder ?? 0,
              },
            })
          } else {
            await tx.variationValue.create({
              data: {
                variationTypeId: id,
                value: v.value,
                colorCode: v.colorCode || null,
                image: v.image || null,
                sortOrder: v.sortOrder ?? 0,
              },
            })
          }
        }
      }

      return tx.variationType.findUnique({
        where: { id },
        include: { values: { orderBy: { sortOrder: "asc" } } },
      })
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("VariationType PUT error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }
  try {
    const { id } = params

    const existing = await db.variationType.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Varyasyon tipi bulunamadı" },
        { status: 404 }
      )
    }

    await db.variationType.delete({ where: { id } })

    return NextResponse.json({ message: "Varyasyon tipi silindi" })
  } catch (error) {
    console.error("VariationType DELETE error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
