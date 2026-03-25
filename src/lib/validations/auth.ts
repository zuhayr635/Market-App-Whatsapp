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
    .min(8, "Şifre en az 8 karakter olmalı")
    .regex(/[A-Z]/, "En az 1 büyük harf içermeli")
    .regex(/[0-9]/, "En az 1 rakam içermeli")
    .regex(/[^A-Za-z0-9]/, "En az 1 özel karakter içermeli"),
  passwordConfirm: z.string().min(1, "Şifre tekrarı zorunludur"),
  securityQuestion: z.string().optional().or(z.literal('')),
  securityAnswer: z.string().optional().or(z.literal('')),
  kvkkConsent: z.literal(true, "KVKK onayı zorunludur"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Şifreler eşleşmiyor",
  path: ["passwordConfirm"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
