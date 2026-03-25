import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Kayit Ol | Market App",
  description: "Yeni bir hesap oluşturun",
}

export default function RegisterPage() {
  return <RegisterForm />
}
