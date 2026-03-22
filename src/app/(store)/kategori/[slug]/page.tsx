import { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSiteSettings, buildMetadata } from '@/lib/seo'
import { CategoryPageClient } from './category-client'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await db.category.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true, image: true },
  }).catch(() => null)

  if (!category) return { title: 'Kategori' }

  const { siteName } = await getSiteSettings()

  return buildMetadata({
    title: category.name,
    description: category.description || undefined,
    path: `/kategori/${params.slug}`,
    image: category.image || undefined,
    siteName,
  })
}

export default function CategoryPage() {
  return <CategoryPageClient />
}
