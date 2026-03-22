import { PrismaClient } from "../src/generated/prisma"
import { hash } from "bcryptjs"
const prisma = new PrismaClient()
async function main() {
  const passwordHash = await hash("Demo1234!", 12)
  const user = await prisma.user.upsert({
    where: { email: "demo@test.com" },
    update: { passwordHash },
    create: {
      name: "Demo",
      surname: "Müşteri",
      email: "demo@test.com",
      phone: "+905551234567",
      passwordHash,
      status: "ACTIVE",
      role: "MEMBER",
    },
  })
  console.log("✓ Demo kullanıcı:", user.email, "| Şifre: Demo1234!")
}
main().catch(console.error).finally(() => prisma.$disconnect())
