import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { AuthProvider } from "@/components/providers/session-provider"
import { WhatsAppWarningModal } from "@/components/auth/whatsapp-warning-modal"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Market App",
  description: "Market platform application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className={cn("font-sans", inter.variable)}>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <WhatsAppWarningModal />
      </body>
    </html>
  )
}
