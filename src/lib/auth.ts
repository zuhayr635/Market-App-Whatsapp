import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "user-login",
      name: "User Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await db.user.findUnique({ where: { email } })
        if (!user) return null

        // Check if account is locked
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("ACCOUNT_LOCKED")
        }

        // Check if account is banned
        if (user.status === "BANNED") {
          throw new Error("ACCOUNT_BANNED")
        }

        if (user.status === "INACTIVE") {
          throw new Error("ACCOUNT_INACTIVE")
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
          // Increment failed logins
          const failedLogins = user.failedLogins + 1
          const updateData: Record<string, unknown> = { failedLogins }

          // Lock account after 5 failed attempts for 15 minutes
          if (failedLogins >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
            updateData.failedLogins = 0
          }

          await db.user.update({ where: { id: user.id }, data: updateData })
          return null
        }

        // Reset failed logins on successful login
        await db.user.update({
          where: { id: user.id },
          data: { failedLogins: 0, lockedUntil: null, lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.name} ${user.surname}`,
          role: user.role,
          type: "user" as const,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string
        token.type = (user as Record<string, unknown>).type as "user" | "admin"
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
    signIn: "/giris",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
})
