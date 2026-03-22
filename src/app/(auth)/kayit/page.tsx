import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Kayit Ol | Market App",
  description: "Yeni bir hesap olusturun",
}

export default function RegisterPage() {
  return <RegisterForm />
}
