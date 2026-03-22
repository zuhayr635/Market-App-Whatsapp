import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { AuthProvider } from "@/components/providers/session-provider"
import { WhatsAppWarningModal } from "@/components/auth/whatsapp-warning-modal"
import { unstable_noStore as noStore } from "next/cache"
import { db } from "@/lib/db"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Market App",
  description: "Market platform application",
}

async function getThemeCSS(): Promise<string> {
  try {
    noStore()
    const settings = await db.themeSetting.findMany()
    if (!settings.length) return ""
    const vars = settings.map((s) => `  --theme-${s.key}: ${s.value};`).join("\n")
    return `:root {\n${vars}\n}`
  } catch {
    return ""
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const themeCSS = await getThemeCSS()

  return (
    <html lang="tr" className={cn("font-sans", inter.variable)}>
      <head>
        {themeCSS && (
          <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCSS }} />
        )}
      </head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <WhatsAppWarningModal />
      </body>
    </html>
  )
}
