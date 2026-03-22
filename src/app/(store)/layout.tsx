import { Metadata } from 'next'
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { WhatsAppFloat } from "@/components/layout/whatsapp-float"
import { CurrencyProvider } from "@/context/currency-context"
import { CookieConsent } from "@/components/cookie-consent"
import { getSiteSettings } from "@/lib/seo"
import { db } from "@/lib/db"
import { AnnouncementBarWrapper } from "@/components/layout/announcement-bar-wrapper"
import { PopupModal } from "@/components/store/popup-modal"

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

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { siteName } = await getSiteSettings()

  const announcementSettings = await db.setting.findMany({
    where: { group: "announcement" },
  })
  const announcementMap: Record<string, string> = {}
  for (const s of announcementSettings) {
    announcementMap[s.key] = s.value
  }
  const announcementEnabled = announcementMap["announcement_enabled"] === "true"
  const announcementText = announcementMap["announcement_text"] ?? ""
  const announcementLink = announcementMap["announcement_link"] ?? ""
  const announcementColor = announcementMap["announcement_color"] ?? "#92400e"

  return (
    <CurrencyProvider>
      <div className="flex min-h-screen flex-col">
        {announcementEnabled && announcementText && (
          <AnnouncementBarWrapper
            text={announcementText}
            link={announcementLink || undefined}
            color={announcementColor}
          />
        )}
        <Header siteName={siteName} />
        <main className="flex-1">{children}</main>
        <Footer siteName={siteName} />
        <WhatsAppFloat />
        <CookieConsent />
        <PopupModal />
      </div>
    </CurrencyProvider>
  )
}
