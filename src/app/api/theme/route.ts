import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const settings = await db.themeSetting.findMany()

    const cssVars = settings
      .map((s) => `  --theme-${s.key}: ${s.value};`)
      .join("\n")

    const css = `:root {\n${cssVars}\n}`

    return new NextResponse(css, {
      headers: { "Content-Type": "text/css" },
    })
  } catch {
    return new NextResponse(":root {}", { headers: { "Content-Type": "text/css" } })
  }
}
