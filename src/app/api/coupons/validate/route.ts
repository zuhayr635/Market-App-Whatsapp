import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { code, orderAmount } = await req.json()

  if (!code) return NextResponse.json({ error: 'Kupon kodu gerekli' }, { status: 400 })

  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } })

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: 'Geçersiz kupon kodu' }, { status: 404 })
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Kupon süresi dolmuş' }, { status: 400 })
  }

  if (coupon.maxUsageCount && coupon.usedCount >= coupon.maxUsageCount) {
    return NextResponse.json({ error: 'Kupon kullanım limiti dolmuş' }, { status: 400 })
  }

  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
    return NextResponse.json({
      error: `Minimum sipariş tutarı: ${coupon.minOrderAmount} TL`,
    }, { status: 400 })
  }

  let discount = 0
  if (coupon.type === 'PERCENTAGE') {
    discount = (orderAmount * Number(coupon.value)) / 100
  } else {
    discount = Math.min(Number(coupon.value), orderAmount)
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount: Math.round(discount * 100) / 100,
    },
  })
}
