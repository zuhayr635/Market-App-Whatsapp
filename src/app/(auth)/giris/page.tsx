import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Giris Yap | Market App",
  description: "Hesabınıza giriş yapın",
}

export default function LoginPage() {
  return <LoginForm />
}
