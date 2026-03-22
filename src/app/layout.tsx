import type { Metadata } from "next"
import { Playfair_Display, DM_Sans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { AuthProvider } from "@/components/providers/session-provider"
import { WhatsAppWarningModal } from "@/components/auth/whatsapp-warning-modal"
import { db } from "@/lib/db"
import { getCached } from "@/lib/cache"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Market App",
  description: "Market platform application",
}

function getThemeCSS(): Promise<string> {
  return getCached("themeCSS", 60_000, async () => {
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
    <html lang="tr" className={cn(playfair.variable, dmSans.variable)}>
      <body className={dmSans.className}>
        {themeCSS && (
          <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCSS }} />
        )}
        <AuthProvider>{children}</AuthProvider>
        <WhatsAppWarningModal />
      </body>
    </html>
  )
}
