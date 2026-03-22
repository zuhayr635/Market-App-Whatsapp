import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'

  // Statik sayfalar
  const staticPages = [
    { url: baseUrl, changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/urunler`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/iletisim`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/sss`, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/kvkk`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/gizlilik`, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${baseUrl}/kullanim-kosullari`, changeFrequency: 'yearly' as const, priority: 0.3 },
  ]

  // Dinamik ürünler
  let productPages: MetadataRoute.Sitemap = []
  try {
    const products = await db.product.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    })
    productPages = products.map((p) => ({
      url: `${baseUrl}/urun/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch { /* DB unavailable at build */ }

  // Dinamik kategoriler
  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const categories = await db.category.findMany({
      where: { status: true },
      select: { slug: true },
    })
    categoryPages = categories.map((c) => ({
      url: `${baseUrl}/kategori/${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch { /* DB unavailable at build */ }

  return [...staticPages, ...productPages, ...categoryPages] as MetadataRoute.Sitemap
}
