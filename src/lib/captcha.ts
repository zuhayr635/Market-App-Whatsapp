import { createHmac, randomUUID } from "crypto"

const SECRET = process.env.NEXTAUTH_SECRET || "captcha-secret"
const TTL_MS = 5 * 60 * 1000 // 5 dakika

function sign(uuid: string, answer: number, expiry: number): string {
  return createHmac("sha256", SECRET).update(`${uuid}:${answer}:${expiry}`).digest("hex")
}

export function verifyCaptcha(token: string, userAnswer: string, sig: string): boolean {
  const parts = token.split("|")
  if (parts.length !== 2) return false

  const uuid = parts[0]
  const expiry = parseInt(parts[1], 10)

  if (isNaN(expiry) || expiry < Date.now()) return false

  const answer = parseInt(userAnswer, 10)
  if (isNaN(answer)) return false

  const expectedSig = sign(uuid, answer, expiry)
  return expectedSig === sig
}

export function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  const ops = [
    { q: `${a} + ${b}`, ans: a + b },
    { q: `${a + b} - ${b}`, ans: a },
    { q: `${a} × ${b > 5 ? 2 : b}`, ans: a * (b > 5 ? 2 : b) },
  ]
  const picked = ops[Math.floor(Math.random() * ops.length)]

  const uuid = randomUUID()
  const expiry = Date.now() + TTL_MS
  const token = `${uuid}|${expiry}`
  const sig = sign(uuid, picked.ans, expiry)

  return { token, question: `${picked.q} = ?`, sig }
}
