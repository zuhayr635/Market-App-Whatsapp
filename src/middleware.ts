import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Admin routes — require admin login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/giris")) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || (session.user as any)?.type !== "admin") {
      return NextResponse.redirect(new URL("/admin/giris", req.url))
    }
  }

  // Protected user routes
  const protectedPaths = ["/hesabim", "/sepet", "/siparislerim", "/favorilerim"]
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/giris", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/admin/:path*",
    "/hesabim/:path*",
    "/sepet/:path*",
    "/siparislerim/:path*",
    "/favorilerim/:path*",
  ],
}
