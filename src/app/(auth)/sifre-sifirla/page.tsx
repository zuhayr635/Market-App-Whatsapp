"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle } from "lucide-react"
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

function SifreSifirlaForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("Geçersiz şifre sıfırlama bağlantısı.")
      return
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.")
      return
    }

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
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

  if (!token) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Geçersiz Bağlantı</CardTitle>
          <CardDescription>
            Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/sifremi-unuttum" className="text-sm text-amber-700 font-medium hover:underline">
            Yeni bağlantı talep et
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Şifre Değiştirildi</CardTitle>
          <CardDescription>
            Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/giris"
            className="text-sm text-amber-700 font-medium hover:underline"
          >
            Giriş sayfasına git
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Şifre Sıfırla</CardTitle>
        <CardDescription>Yeni şifrenizi belirleyin</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Yeni Şifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError("") }}
              className="h-10"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Yeni Şifre Tekrar</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => { setPasswordConfirm(e.target.value); setError("") }}
              className="h-10"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full h-10 bg-amber-700 hover:bg-amber-800 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Şifre değiştiriliyor...
              </>
            ) : (
              "Şifremi Değiştir"
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

export default function SifreSifirlaPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
          </CardContent>
        </Card>
      }
    >
      <SifreSifirlaForm />
    </Suspense>
  )
}
