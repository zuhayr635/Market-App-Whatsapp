import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Giris Yap | Market App",
  description: "Hesabiniza giris yapin",
}

export default function LoginPage() {
  return <LoginForm />
}
