import { db } from "@/lib/db"
import Link from "next/link"
import { MessageCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SssPage() {
  const faqs = await db.faq.findMany({
    where: { status: true },
    orderBy: { sortOrder: "asc" },
  })

  let whatsappNumber = ""
  try {
    const setting = await db.setting.findUnique({ where: { key: "whatsapp_number" } })
    if (setting) whatsappNumber = setting.value.replace(/\D/g, "")
  } catch {
    // ignore
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-12 text-center text-white">
        <h1 className="text-3xl font-bold">Sıkça Sorulan Sorular</h1>
        <p className="mt-2 text-blue-100">Merak ettiklerinize hızlıca yanıt bulun</p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        {faqs.length === 0 ? (
          <div className="rounded-xl bg-white border p-8 text-center text-muted-foreground">
            <p>Henüz SSS eklenmemiş.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-xl border bg-white px-5 py-4 open:shadow-sm transition-all"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 font-medium text-sm select-none list-none">
                  <span>{faq.question}</span>
                  <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <div className="mt-3 text-sm text-muted-foreground leading-relaxed border-t pt-3">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-xl bg-green-50 border border-green-100 p-6 text-center">
          <h3 className="font-semibold text-gray-900">Sorunuz mu var?</h3>
          <p className="mt-1 text-sm text-gray-600">
            Aradığınız cevabı bulamadıysanız WhatsApp&apos;tan bize yazın.
          </p>
          {whatsappNumber ? (
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp&apos;tan Yazın
            </a>
          ) : (
            <Link
              href="/iletisim"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              İletişime Geçin
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
