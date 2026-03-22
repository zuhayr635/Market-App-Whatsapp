import { Metadata } from 'next'
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { WhatsAppFloat } from "@/components/layout/whatsapp-float"
import { CurrencyProvider } from "@/context/currency-context"
import { CookieConsent } from "@/components/cookie-consent"
import { getSiteSettings } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteDescription } = await getSiteSettings()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com'
  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description: siteDescription,
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: 'website',
      siteName,
    },
  }
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFloat />
        <CookieConsent />
      </div>
    </CurrencyProvider>
  )
}
