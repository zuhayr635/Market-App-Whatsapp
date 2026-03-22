"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const result = await signIn("user-login", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes("ACCOUNT_LOCKED")) {
          toast.error("Hesabiniz gecici olarak kilitlendi. Lutfen 15 dakika sonra tekrar deneyiniz.")
        } else if (result.error.includes("ACCOUNT_BANNED")) {
          toast.error("Hesabiniz yasaklanmistir. Lutfen destek ile iletisime geciniz.")
        } else if (result.error.includes("ACCOUNT_INACTIVE")) {
          toast.error("Hesabiniz aktif degil. Lutfen destek ile iletisime geciniz.")
        } else {
          toast.error("E-posta veya sifre hatali.")
        }
        return
      }

      toast.success("Basariyla giris yapildi!")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Bir hata olustu. Lutfen tekrar deneyiniz.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Giris Yap</CardTitle>
        <CardDescription>Hesabiniza giris yapin</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              className="h-10"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Sifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              className="h-10"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Beni Hatirla
              </Label>
            </div>
            <Link
              href="/sifremi-unuttum"
              className="text-sm text-primary hover:underline"
            >
              Şifremi Unuttum?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-10"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Giris yapiliyor...
              </>
            ) : (
              "Giris Yap"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Hesabiniz yok mu?{" "}
          <Link href="/kayit" className="text-primary font-medium hover:underline">
            Kayit Ol
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
