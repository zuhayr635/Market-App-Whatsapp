"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, Check, X } from "lucide-react"

import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface City {
  id: number
  name: string
  plateCode: string
}

interface District {
  id: number
  name: string
  cityId: number
}

const SECURITY_QUESTIONS = [
  "Annenizin kizlik soyadi nedir?",
  "Ilk evcil hayvaninizin adi nedir?",
  "Ilk okulunuzun adi nedir?",
  "En sevdiginiz film nedir?",
  "Dogdugunuz sehir neresidir?",
]

function PasswordStrengthIndicator({ password }: { password: string }) {
  const requirements = [
    { label: "En az 8 karakter", met: password.length >= 8 },
    { label: "En az 1 buyuk harf", met: /[A-Z]/.test(password) },
    { label: "En az 1 rakam", met: /[0-9]/.test(password) },
    { label: "En az 1 ozel karakter", met: /[^A-Za-z0-9]/.test(password) },
  ]

  const metCount = requirements.filter((r) => r.met).length
  const strengthPercent = (metCount / requirements.length) * 100

  return (
    <div className="space-y-2 mt-2">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${strengthPercent}%`,
            backgroundColor:
              metCount <= 1
                ? "var(--destructive)"
                : metCount <= 2
                  ? "#f59e0b"
                  : metCount <= 3
                    ? "#3b82f6"
                    : "#22c55e",
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1">
        {requirements.map((req) => (
          <div key={req.label} className="flex items-center gap-1.5 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-green-500 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [loadingDistricts, setLoadingDistricts] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      kvkkConsent: false as unknown as true,
    },
  })

  const watchPassword = watch("password", "")
  const watchCityId = watch("cityId", "")
  const watchKvkk = watch("kvkkConsent")

  useEffect(() => {
    fetch("/api/cities")
      .then((res) => res.json())
      .then((data) => setCities(data))
      .catch(() => toast.error("Sehirler yuklenirken hata olustu"))
  }, [])

  const fetchDistricts = useCallback((cityId: string) => {
    if (!cityId) {
      setDistricts([])
      return
    }
    setLoadingDistricts(true)
    fetch(`/api/cities/${cityId}/districts`)
      .then((res) => res.json())
      .then((data) => setDistricts(data))
      .catch(() => toast.error("Ilceler yuklenirken hata olustu"))
      .finally(() => setLoadingDistricts(false))
  }, [])

  useEffect(() => {
    if (watchCityId) {
      setValue("districtId", "")
      fetchDistricts(watchCityId)
    } else {
      setDistricts([])
    }
  }, [watchCityId, fetchDistricts, setValue])

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          toast.error("Bu e-posta adresi zaten kayitli.")
        } else if (result.errors) {
          const firstError = Object.values(result.errors)[0]
          toast.error(Array.isArray(firstError) ? firstError[0] as string : "Gecersiz bilgiler.")
        } else {
          toast.error(result.message || "Kayit sirasinda bir hata olustu.")
        }
        return
      }

      toast.success("Kayit basarili! Giris yapabilirsiniz.")
      router.push("/giris")
    } catch {
      toast.error("Bir hata olustu. Lutfen tekrar deneyiniz.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Kayit Ol</CardTitle>
        <CardDescription>Yeni bir hesap olusturun</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name and Surname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ad</Label>
              <Input
                id="name"
                placeholder="Adiniz"
                {...register("name")}
                aria-invalid={!!errors.name}
                className="h-10"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Soyad</Label>
              <Input
                id="surname"
                placeholder="Soyadiniz"
                {...register("surname")}
                aria-invalid={!!errors.surname}
                className="h-10"
              />
              {errors.surname && (
                <p className="text-sm text-destructive">{errors.surname.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="reg-email">E-posta</Label>
            <Input
              id="reg-email"
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

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                +90
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="5XX XXX XX XX"
                {...register("phone")}
                aria-invalid={!!errors.phone}
                className="h-10 rounded-l-none"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* City and District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cityId">Sehir</Label>
              <select
                id="cityId"
                {...register("cityId")}
                aria-invalid={!!errors.cityId}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">Sehir seciniz</option>
                {cities.map((city) => (
                  <option key={city.id} value={String(city.id)}>
                    {city.name}
                  </option>
                ))}
              </select>
              {errors.cityId && (
                <p className="text-sm text-destructive">{errors.cityId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="districtId">Ilce</Label>
              <select
                id="districtId"
                {...register("districtId")}
                aria-invalid={!!errors.districtId}
                disabled={!watchCityId || loadingDistricts}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                <option value="">
                  {loadingDistricts ? "Yukleniyor..." : "Ilce seciniz"}
                </option>
                {districts.map((district) => (
                  <option key={district.id} value={String(district.id)}>
                    {district.name}
                  </option>
                ))}
              </select>
              {errors.districtId && (
                <p className="text-sm text-destructive">{errors.districtId.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <Textarea
              id="address"
              placeholder="Acik adresinizi giriniz"
              {...register("address")}
              aria-invalid={!!errors.address}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="reg-password">Sifre</Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              className="h-10"
            />
            {watchPassword && <PasswordStrengthIndicator password={watchPassword} />}
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Password Confirm */}
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Sifre Tekrar</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              {...register("passwordConfirm")}
              aria-invalid={!!errors.passwordConfirm}
              className="h-10"
            />
            {errors.passwordConfirm && (
              <p className="text-sm text-destructive">{errors.passwordConfirm.message}</p>
            )}
          </div>

          {/* Security Question */}
          <div className="space-y-2">
            <Label htmlFor="securityQuestion">Guvenlik Sorusu</Label>
            <select
              id="securityQuestion"
              {...register("securityQuestion")}
              aria-invalid={!!errors.securityQuestion}
              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
            >
              <option value="">Guvenlik sorusu seciniz</option>
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            {errors.securityQuestion && (
              <p className="text-sm text-destructive">{errors.securityQuestion.message}</p>
            )}
          </div>

          {/* Security Answer */}
          <div className="space-y-2">
            <Label htmlFor="securityAnswer">Guvenlik Cevabi</Label>
            <Input
              id="securityAnswer"
              placeholder="Cevaninizi giriniz"
              {...register("securityAnswer")}
              aria-invalid={!!errors.securityAnswer}
              className="h-10"
            />
            {errors.securityAnswer && (
              <p className="text-sm text-destructive">{errors.securityAnswer.message}</p>
            )}
          </div>

          {/* KVKK Consent */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Checkbox
                id="kvkkConsent"
                checked={watchKvkk === true}
                onCheckedChange={(checked) => {
                  setValue("kvkkConsent", checked === true ? true : false as unknown as true, {
                    shouldValidate: true,
                  })
                }}
                className="mt-0.5"
              />
              <Label htmlFor="kvkkConsent" className="text-sm font-normal leading-snug cursor-pointer">
                <Link
                  href="/kvkk"
                  target="_blank"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  KVKK Aydinlatma Metni
                </Link>
                &apos;ni okudum ve kabul ediyorum.
              </Label>
            </div>
            {errors.kvkkConsent && (
              <p className="text-sm text-destructive">{errors.kvkkConsent.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-10"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kayit yapiliyor...
              </>
            ) : (
              "Kayit Ol"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Zaten hesabiniz var mi?{" "}
          <Link href="/giris" className="text-primary font-medium hover:underline">
            Giris Yap
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
