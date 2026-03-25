export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/providers/session-provider"
import { WhatsAppWarningModal } from "@/components/auth/whatsapp-warning-modal"
import { db } from "@/lib/db"
import { getCached } from "@/lib/cache"

export const metadata: Metadata = {
  title: "Market App",
  description: "Market platform application",
}

function getThemeCSS(): Promise<string> {
  return getCached("themeCSS", 300_000, async () => {
    const settings = await db.themeSetting.findMany()
    if (!settings.length) return ""
    const vars = settings.map((s) => `  --theme-${s.key}: ${s.value};`).join("\n")
    return `:root {\n${vars}\n}`
  }).catch(() => "")
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const themeCSS = await getThemeCSS()

  return (
    <html lang="tr">
      <body>
        {themeCSS && (
          <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCSS }} />
        )}
        <AuthProvider>{children}</AuthProvider>
        <WhatsAppWarningModal />
      </body>
    </html>
  )
}
