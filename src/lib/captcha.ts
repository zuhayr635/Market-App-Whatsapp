import { createHmac, randomUUID } from "crypto"

const SECRET = process.env.NEXTAUTH_SECRET || "captcha-secret"
const TTL_MS = 5 * 60 * 1000 // 5 dakika

function sign(token: string, answer: number, expiry: number): string {
  return createHmac("sha256", SECRET).update(`${token}:${answer}:${expiry}`).digest("hex")
}

export function verifyCaptcha(token: string, userAnswer: string, sig: string): boolean {
  // Decode expiry and answer from sig verification (stateless)
  // Try all reasonable answers (1-100) to find a match
  const now = Date.now()
  for (let tryAnswer = 0; tryAnswer <= 200; tryAnswer++) {
    // Check multiple possible expiry windows (last 5 minutes, in 1-second increments would be too slow)
    // Instead, extract expiry from the token format: token contains expiry
    const expectedSig = sign(token.split('|')[0], tryAnswer, parseInt(token.split('|')[1] || '0'))
    if (expectedSig === sig) {
      const expiry = parseInt(token.split('|')[1] || '0')
      if (expiry < now) return false // expired
      return parseInt(userAnswer, 10) === tryAnswer
    }
  }
  return false
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
