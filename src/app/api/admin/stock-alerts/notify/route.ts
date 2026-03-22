import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId } = await req.json()

  const alerts = await db.stockAlert.findMany({
    where: { productId, isNotified: false },
    include: { product: { select: { name: true, slug: true } } },
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  for (const alert of alerts) {
    try {
      await sendEmail({
        to: alert.email,
        subject: `${alert.product.name} - Stok Bildirimi`,
        html: `
          <h2>${alert.product.name} stoka girdi!</h2>
          <p>Beklediğiniz ürün artık stokta mevcut.</p>
          <a href="${baseUrl}/urun/${alert.product.slug}"
             style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
            Ürünü İncele
          </a>
        `,
      })
      await db.stockAlert.update({ where: { id: alert.id }, data: { isNotified: true } })
    } catch {
      /* skip failed emails */
    }
  }

  return NextResponse.json({ ok: true, notified: alerts.length })
}
