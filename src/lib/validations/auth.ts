import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(1, "Şifre zorunludur"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı"),
  surname: z.string().min(2, "Soyad en az 2 karakter olmalı"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  cityId: z.string().min(1, "Şehir seçimi zorunludur"),
  districtId: z.string().min(1, "İlçe seçimi zorunludur"),
  address: z.string().min(10, "Adres en az 10 karakter olmalı"),
  password: z
    .string()
    .min(6, "Şifre en az 6 karakter olmalı"),
  passwordConfirm: z.string().min(1, "Şifre tekrarı zorunludur"),
  securityQuestion: z.string(),
  securityAnswer: z.string(),
  kvkkConsent: z.boolean().refine((val) => val === true, { message: "KVKK onayı zorunludur" }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Şifreler eşleşmiyor",
  path: ["passwordConfirm"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
