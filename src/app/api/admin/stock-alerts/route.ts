import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (session?.user?.type !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const alerts = await db.stockAlert.findMany({
    include: { product: { select: { name: true, slug: true, stockQty: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(alerts)
}
