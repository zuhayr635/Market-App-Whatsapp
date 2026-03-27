"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Upload, ImageIcon, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GalleryImage {
  id: string
  url: string
  altText?: string | null
}

interface ImagePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  productId?: string
  title?: string
}

export function ImagePickerModal({
  open,
  onClose,
  onSelect,
  productId,
  title = "Görsel Seç",
}: ImagePickerModalProps) {
  const [tab, setTab] = useState<"gallery" | "upload">("gallery")
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchGallery = useCallback(async () => {
    try {
      const url = productId
        ? `/api/admin/products/${productId}/images`
        : `/api/admin/upload/gallery`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setGalleryImages(Array.isArray(data) ? data : [])
      }
    } catch {
      // silent
    }
  }, [productId])

  useEffect(() => {
    if (open) {
      setSelectedUrl(null)
      fetchGallery()
    }
  }, [open, fetchGallery])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Yükleme hatası")
        return
      }
      const data = await res.json()
      onSelect(data.url)
      onClose()
    } catch {
      toast.error("Yükleme başarısız")
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b mb-3">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "gallery"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("gallery")}
          >
            Galeriden Seç
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("upload")}
          >
            Dosya Yükle
          </button>
        </div>

        {tab === "gallery" ? (
          <>
            {galleryImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <ImageIcon className="size-8 mb-2" />
                <p className="text-sm">Henüz görsel yok</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto">
                {galleryImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedUrl(img.url)}
                    className={`relative aspect-square rounded-md border-2 overflow-hidden transition-all ${
                      selectedUrl === img.url
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.altText || ""}
                      className="w-full h-full object-cover"
                    />
                    {selectedUrl === img.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="size-5 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="size-3.5 mr-1" /> İptal
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={!selectedUrl}>
                Seç
              </Button>
            </div>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
                e.target.value = ""
              }}
            />
            <Upload className="size-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Tıklayın veya sürükleyin</p>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, GIF - Maks. 5MB</p>
            {uploading && <p className="text-xs text-primary mt-2">Yükleniyor...</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
