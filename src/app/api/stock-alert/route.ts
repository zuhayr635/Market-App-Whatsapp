import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { productId, email } = await req.json()

  if (!productId || !email) {
    return NextResponse.json({ error: 'Ürün ve e-posta gerekli' }, { status: 400 })
  }

  try {
    await db.stockAlert.upsert({
      where: { productId_email: { productId, email } },
      update: { isNotified: false },
      create: { productId, email },
    })
    return NextResponse.json({ ok: true, message: 'Stok geldiğinde e-posta ile bilgilendirileceksiniz' })
  } catch {
    return NextResponse.json({ error: 'Kayıt oluşturulamadı' }, { status: 500 })
  }
}
