import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const coupon = await db.coupon.update({
    where: { id: params.id },
    data: {
      isActive: data.isActive,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  })
  return NextResponse.json(coupon)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.coupon.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
