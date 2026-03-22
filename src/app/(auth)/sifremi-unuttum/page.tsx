"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Lütfen e-posta adresinizi giriniz.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || "Bir hata oluştu. Lütfen tekrar deneyiniz.")
        return
      }

      setSuccess(true)
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyiniz.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <MailCheck className="h-12 w-12 text-amber-700" />
          </div>
          <CardTitle className="text-2xl font-bold">E-posta Gönderildi</CardTitle>
          <CardDescription>
            Şifre sıfırlama linki e-posta adresinize gönderildi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            E-posta adresinize gönderilen bağlantıya tıklayarak şifrenizi sıfırlayabilirsiniz.
            Bağlantı <strong>1 saat</strong> geçerlidir.
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            E-posta gelmezse spam klasörünüzü kontrol ediniz.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/giris" className="text-sm text-amber-700 font-medium hover:underline">
            Giriş sayfasına dön
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Şifremi Unuttum</CardTitle>
        <CardDescription>
          E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError("") }}
              className="h-10"
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-10 bg-amber-700 hover:bg-amber-800 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              "Sıfırlama Bağlantısı Gönder"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Şifrenizi hatırladınız mı?{" "}
          <Link href="/giris" className="text-amber-700 font-medium hover:underline">
            Giriş Yap
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
