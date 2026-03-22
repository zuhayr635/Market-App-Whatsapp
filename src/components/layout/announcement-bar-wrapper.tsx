"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface AnnouncementBarWrapperProps {
  text: string
  link?: string
  color?: string
}

export function AnnouncementBarWrapper({ text, link, color = "#92400e" }: AnnouncementBarWrapperProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const closed = sessionStorage.getItem("announcement_closed")
    if (!closed) {
      setVisible(true)
    }
  }, [])

  function handleClose() {
    sessionStorage.setItem("announcement_closed", "true")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="relative z-50 flex items-center justify-center px-10 py-2 text-sm font-medium text-white"
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center gap-2">
        {link ? (
          <a
            href={link}
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            {text}
          </a>
        ) : (
          <span>{text}</span>
        )}
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Duyuruyu kapat"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-white/20 transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
