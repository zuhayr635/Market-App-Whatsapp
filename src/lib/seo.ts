import { db } from '@/lib/db'

export async function getSiteSettings() {
  try {
    const settings = await db.setting.findMany({
      where: { key: { in: ['site_name', 'site_description', 'site_logo'] } }
    })
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    return {
      siteName: map.site_name || 'Market',
      siteDescription: map.site_description || 'Online alışveriş platformu',
      siteLogo: map.site_logo || '',
    }
  } catch {
    return { siteName: 'Market', siteDescription: 'Online alışveriş platformu', siteLogo: '' }
  }
}

export function buildMetadata({
  title,
  description,
  path = '',
  image,
  siteName,
}: {
  title: string
  description?: string
  path?: string
  image?: string
  siteName: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
  const url = `${baseUrl}${path}`
  return {
    title: `${title} | ${siteName}`,
    description: description || '',
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${siteName}`,
      description: description || '',
      url,
      siteName,
      type: 'website' as const,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}
