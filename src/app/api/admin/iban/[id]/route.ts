import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-admin"
import { db } from "@/lib/db"

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
  const { bankName, iban, accountHolder, branchCode, currency, sortOrder, status } = body

  const updated = await db.ibanInfo.update({
    where: { id: params.id },
    data: {
      ...(bankName !== undefined && { bankName }),
      ...(iban !== undefined && { iban }),
      ...(accountHolder !== undefined && { accountHolder }),
      ...(branchCode !== undefined && { branchCode }),
      ...(currency !== undefined && { currency }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(status !== undefined && { status }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user || (session.user as any).type !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
  }

  await db.ibanInfo.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
