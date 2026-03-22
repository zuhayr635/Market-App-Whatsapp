import { NextResponse } from "next/server"
import { createHmac, randomUUID } from "crypto"

const SECRET = process.env.NEXTAUTH_SECRET || "captcha-secret"
const TTL_MS = 5 * 60 * 1000 // 5 dakika

// In-memory store: token → { answer, expiry }
const store = new Map<string, { answer: number; expiry: number }>()

// Süresi geçenleri temizle
function cleanup() {
  const now = Date.now()
  store.forEach((val, key) => {
    if (val.expiry < now) store.delete(key)
  })
}

function sign(token: string, answer: number, expiry: number): string {
  return createHmac("sha256", SECRET).update(`${token}:${answer}:${expiry}`).digest("hex")
}

export function verifyCaptcha(token: string, userAnswer: string, sig: string): boolean {
  cleanup()
  const entry = store.get(token)
  if (!entry) return false
  if (entry.expiry < Date.now()) {
    store.delete(token)
    return false
  }
  const expectedSig = sign(token, entry.answer, entry.expiry)
  if (sig !== expectedSig) return false
  if (parseInt(userAnswer, 10) !== entry.answer) return false
  store.delete(token) // tek kullanım
  return true
}

export async function GET() {
  cleanup()

  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  const ops = [
    { q: `${a} + ${b}`, ans: a + b },
    { q: `${a + b} - ${b}`, ans: a },
    { q: `${a} × ${b > 5 ? 2 : b}`, ans: a * (b > 5 ? 2 : b) },
  ]
  const picked = ops[Math.floor(Math.random() * ops.length)]

  const token = randomUUID()
  const expiry = Date.now() + TTL_MS
  const sig = sign(token, picked.ans, expiry)

  store.set(token, { answer: picked.ans, expiry })

  return NextResponse.json({ token, question: `${picked.q} = ?`, sig })
}
