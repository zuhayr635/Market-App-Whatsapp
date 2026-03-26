import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(1, "Şifre zorunludur"),
})

export const registerSchema = z.object({
  name: z.string({ required_error: "Ad zorunludur" }).min(2, "Ad en az 2 karakter olmalı"),
  surname: z.string({ required_error: "Soyad zorunludur" }).min(2, "Soyad en az 2 karakter olmalı"),
  email: z.string({ required_error: "E-posta zorunludur" }).email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string({ required_error: "Telefon zorunludur" }).min(10, "Geçerli bir telefon numarası giriniz"),
  cityId: z.string({ required_error: "Şehir seçimi zorunludur" }).min(1, "Şehir seçimi zorunludur"),
  districtId: z.string({ required_error: "İlçe seçimi zorunludur" }).min(1, "İlçe seçimi zorunludur"),
  address: z.string({ required_error: "Adres zorunludur" }).min(10, "Adres en az 10 karakter olmalı"),
  password: z
    .string({ required_error: "Şifre zorunludur" })
    .min(8, "Şifre en az 8 karakter olmalı")
    .regex(/[A-Z]/, "En az 1 büyük harf içermeli")
    .regex(/[0-9]/, "En az 1 rakam içermeli")
    .regex(/[^A-Za-z0-9]/, "En az 1 özel karakter içermeli"),
  passwordConfirm: z.string({ required_error: "Şifre tekrarı zorunludur" }).min(1, "Şifre tekrarı zorunludur"),
  securityQuestion: z.string(),
  securityAnswer: z.string(),
  kvkkConsent: z.boolean().refine((val) => val === true, { message: "KVKK onayı zorunludur" }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Şifreler eşleşmiyor",
  path: ["passwordConfirm"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
