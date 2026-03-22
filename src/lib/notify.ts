import { db } from "@/lib/db"

export async function createNotification(
  type: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    await db.notification.create({
      data: { type, title, message, link: link || null },
    })
  } catch (err) {
    console.error("[NOTIFY] Failed to create notification:", err)
  }
}
