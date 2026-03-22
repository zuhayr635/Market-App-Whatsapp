import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/hesabim/', '/sepet/', '/siparislerim/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
