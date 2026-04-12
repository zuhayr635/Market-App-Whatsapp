import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "admin-login",
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        const admin = await db.adminUser.findUnique({ where: { email } })
        if (!admin || !admin.status) return null

        const isValid = await bcrypt.compare(password, admin.passwordHash)
        if (!isValid) return null

        await db.adminUser.update({
          where: { id: admin.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: admin.id,
          email: admin.email,
          name: `${admin.name} ${admin.surname}`,
          role: "ADMIN",
          type: "admin" as const,
        }
      },
    }),
  ],
  basePath: "/api/admin/auth",
  cookies: {
    sessionToken: {
      name: "market-admin-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string
        token.type = (user as Record<string, unknown>).type as "admin"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).role = token.role
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).type = token.type
      }
      return session
    },
  },
  pages: {
    signIn: "/admin/giris",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
})
