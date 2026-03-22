import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (session?.user?.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(coupons)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const coupon = await db.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount || null,
      maxUsageCount: data.maxUsageCount || null,
      isActive: data.isActive ?? true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  })
  return NextResponse.json(coupon)
}
