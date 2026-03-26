import { z } from "zod"

// Helper: accepts undefined/null and converts to empty string before validation
const safeString = z.preprocess((v) => (v === undefined || v === null ? "" : v), z.string())

export const loginSchema = z.object({
  email: safeString.pipe(z.string().email("Geçerli bir e-posta adresi giriniz")),
  password: safeString.pipe(z.string().min(1, "Şifre zorunludur")),
})

export const registerSchema = z.object({
  name: safeString.pipe(z.string().min(2, "Ad en az 2 karakter olmalı")),
  surname: safeString.pipe(z.string().min(2, "Soyad en az 2 karakter olmalı")),
  email: safeString.pipe(z.string().email("Geçerli bir e-posta adresi giriniz")),
  phone: safeString.pipe(z.string().min(10, "Geçerli bir telefon numarası giriniz")),
  cityId: safeString.pipe(z.string().min(1, "Şehir seçimi zorunludur")),
  districtId: safeString.pipe(z.string().min(1, "İlçe seçimi zorunludur")),
  address: safeString.pipe(z.string().min(10, "Adres en az 10 karakter olmalı")),
  password: safeString.pipe(
    z.string()
      .min(8, "Şifre en az 8 karakter olmalı")
      .regex(/[A-Z]/, "En az 1 büyük harf içermeli")
      .regex(/[0-9]/, "En az 1 rakam içermeli")
      .regex(/[^A-Za-z0-9]/, "En az 1 özel karakter içermeli")
  ),
  passwordConfirm: safeString.pipe(z.string().min(1, "Şifre tekrarı zorunludur")),
  securityQuestion: safeString,
  securityAnswer: safeString,
  kvkkConsent: z.preprocess((v) => v === true || v === "true", z.boolean().refine((val) => val === true, { message: "KVKK onayı zorunludur" })),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Şifreler eşleşmiyor",
  path: ["passwordConfirm"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
