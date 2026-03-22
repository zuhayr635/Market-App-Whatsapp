import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Gecerli bir e-posta adresi giriniz"),
  password: z.string().min(1, "Sifre zorunludur"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmali"),
  surname: z.string().min(2, "Soyad en az 2 karakter olmali"),
  email: z.string().email("Gecerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Gecerli bir telefon numarasi giriniz"),
  cityId: z.string().min(1, "Sehir secimi zorunludur"),
  districtId: z.string().min(1, "Ilce secimi zorunludur"),
  address: z.string().min(10, "Adres en az 10 karakter olmali"),
  password: z
    .string()
    .min(8, "Sifre en az 8 karakter olmali")
    .regex(/[A-Z]/, "En az 1 buyuk harf icermeli")
    .regex(/[0-9]/, "En az 1 rakam icermeli")
    .regex(/[^A-Za-z0-9]/, "En az 1 ozel karakter icermeli"),
  passwordConfirm: z.string(),
  securityQuestion: z.string().min(1, "Guvenlik sorusu secimi zorunludur"),
  securityAnswer: z.string().min(1, "Guvenlik cevabi zorunludur"),
  kvkkConsent: z.literal(true, { error: "KVKK onayi zorunludur" }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Sifreler eslesmiyor",
  path: ["passwordConfirm"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
