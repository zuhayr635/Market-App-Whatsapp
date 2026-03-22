import nodemailer from "nodemailer"
import { db } from "@/lib/db"

async function getSmtpConfig() {
  const keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "mail_from_name", "mail_from_email"]
  const settings = await db.setting.findMany({ where: { key: { in: keys } } })
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return map
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  let config: Record<string, string> = {}
  try {
    config = await getSmtpConfig()
  } catch {
    // db not available
  }

  const host = config["smtp_host"]
  const user = config["smtp_user"]
  const pass = config["smtp_pass"]

  if (!host || !user || !pass) {
    console.log("[EMAIL] SMTP not configured — logging email instead")
    console.log(`[EMAIL] To: ${to}`)
    console.log(`[EMAIL] Subject: ${subject}`)
    console.log(`[EMAIL] HTML: ${html.slice(0, 200)}...`)
    return
  }

  const port = parseInt(config["smtp_port"] || "587", 10)
  const fromName = config["mail_from_name"] || "Market"
  const fromEmail = config["mail_from_email"] || user

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error("[EMAIL] Failed to send email:", err)
  }
}

export async function sendEmailFromTemplate(
  templateName: string,
  to: string,
  variables: Record<string, string>
) {
  const template = await db.emailTemplate.findUnique({ where: { name: templateName } })
  if (!template) {
    console.warn(`[EMAIL] Template not found: ${templateName}`)
    return
  }

  let content = template.content
  let subject = template.subject

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, "g")
    content = content.replace(regex, value)
    subject = subject.replace(regex, value)
  }

  await sendEmail({ to, subject, html: content })
}
