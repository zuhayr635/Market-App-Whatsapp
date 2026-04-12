import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Admin routes — check market-admin-session cookie
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/giris")) {
    const adminToken = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName: "market-admin-session",
    })
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/giris", req.url))
    }
    return NextResponse.next()
  }

  // Protected user routes — check authjs.session-token cookie
  const protectedPaths = ["/hesabim", "/sepet", "/siparislerim", "/favorilerim"]
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtected) {
    const userToken = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName: "authjs.session-token",
    })
    if (!userToken) {
      return NextResponse.redirect(new URL("/giris", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/hesabim/:path*",
    "/sepet/:path*",
    "/siparislerim/:path*",
    "/favorilerim/:path*",
  ],
}
