"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Star,
  Trash2,
  Upload,
  ImageIcon,
  X,
  GripVertical,
  ZoomIn,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// ---------- Types ----------

interface ProductImageData {
  id: string
  productId: string
  url: string
  altText: string | null
  title: string | null
  description: string | null
  sortOrder: number
  isFeatured: boolean
}

// For images not yet saved (create mode)
interface PendingImage {
  tempId: string
  url: string
  fileName: string
  altText: string
  title: string
  description: string
  isFeatured: boolean
  sortOrder: number
}

type ImageItem = (ProductImageData | PendingImage) & { uploading?: boolean }

function isProductImage(img: ImageItem): img is ProductImageData {
  return "id" in img && !("tempId" in img)
}

function getKey(img: ImageItem): string {
  return isProductImage(img) ? img.id : (img as PendingImage).tempId
}

interface ImageGalleryManagerProps {
  productId?: string
  onPendingImagesChange?: (images: PendingImage[]) => void
}

const MAX_IMAGES = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

// ---------- Component ----------

export function ImageGalleryManager({
  productId,
  onPendingImagesChange,
}: ImageGalleryManagerProps) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [dragOver, setDragOver] = useState(false)
  const [detailImage, setDetailImage] = useState<ImageItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<ImageItem | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  // Fetch images for existing product
  useEffect(() => {
    if (!productId) return
    fetch(`/api/admin/products/${productId}/images`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ProductImageData[]) => setImages(data))
      .catch(() => {})
  }, [productId])

  // Notify parent of pending images
  useEffect(() => {
    if (!productId && onPendingImagesChange) {
      const pending = images.filter(
        (img) => "tempId" in img
      ) as PendingImage[]
      onPendingImagesChange(pending)
    }
  }, [images, productId, onPendingImagesChange])

  // Upload a single file
  const uploadFile = useCallback(
    async (file: File): Promise<{ url: string; fileName: string } | null> => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Desteklenmeyen format`)
        return null
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: Dosya boyutu 5MB'dan büyük`)
        return null
      }

      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        })
        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error || "Yükleme hatası")
          return null
        }
        return await res.json()
      } catch {
        toast.error(`${file.name}: Yükleme başarısız`)
        return null
      }
    },
    []
  )

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const remaining = MAX_IMAGES - images.length
      if (remaining <= 0) {
        toast.error(`En fazla ${MAX_IMAGES} görsel yüklenebilir`)
        return
      }
      const toUpload = fileArray.slice(0, remaining)
      if (fileArray.length > remaining) {
        toast.error(
          `${fileArray.length - remaining} görsel limit nedeniyle atıldı`
        )
      }

      setUploading(true)

      for (const file of toUpload) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
        setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }))

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[tempId] ?? 0
            if (current >= 90) {
              clearInterval(progressInterval)
              return prev
            }
            return { ...prev, [tempId]: current + 10 }
          })
        }, 100)

        const result = await uploadFile(file)
        clearInterval(progressInterval)

        if (result) {
          setUploadProgress((prev) => ({ ...prev, [tempId]: 100 }))

          if (productId) {
            // Save to DB immediately
            try {
              const res = await fetch(
                `/api/admin/products/${productId}/images`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    url: result.url,
                    isFeatured: images.length === 0,
                  }),
                }
              )
              if (res.ok) {
                const saved: ProductImageData = await res.json()
                setImages((prev) => [...prev, saved])
              }
            } catch {
              toast.error("Görsel kaydedilemedi")
            }
          } else {
            // Create mode — store as pending
            const pending: PendingImage = {
              tempId,
              url: result.url,
              fileName: result.fileName,
              altText: "",
              title: "",
              description: "",
              isFeatured: images.length === 0,
              sortOrder: images.length,
            }
            setImages((prev) => [...prev, pending])
          }
        }

        // Clean up progress
        setTimeout(() => {
          setUploadProgress((prev) => {
            const next = { ...prev }
            delete next[tempId]
            return next
          })
        }, 500)
      }

      setUploading(false)
    },
    [images.length, productId, uploadFile]
  )

  // Drag and drop handlers for upload zone
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  // Set featured image
  const setFeatured = useCallback(
    async (img: ImageItem) => {
      setImages((prev) =>
        prev.map((i) => ({
          ...i,
          isFeatured: getKey(i) === getKey(img),
        }))
      )

      if (productId && isProductImage(img)) {
        try {
          const allImages = images.map((i) => ({
            id: isProductImage(i) ? i.id : "",
            sortOrder: i.sortOrder,
            isFeatured: getKey(i) === getKey(img),
            altText: i.altText,
            title: i.title,
            description: i.description,
          })).filter((i) => i.id)

          await fetch(`/api/admin/products/${productId}/images`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: allImages }),
          })
        } catch {
          toast.error("Güncellenemedi")
        }
      }
    },
    [images, productId]
  )

  // Delete image
  const handleDelete = useCallback(
    async (img: ImageItem) => {
      if (productId && isProductImage(img)) {
        try {
          const res = await fetch(
            `/api/admin/products/${productId}/images?imageId=${img.id}`,
            { method: "DELETE" }
          )
          if (!res.ok) {
            toast.error("Görsel silinemedi")
            return
          }
        } catch {
          toast.error("Görsel silinemedi")
          return
        }
      }

      setImages((prev) => {
        const filtered = prev.filter((i) => getKey(i) !== getKey(img))
        // If deleted was featured, set first as featured
        if (img.isFeatured && filtered.length > 0) {
          filtered[0] = { ...filtered[0], isFeatured: true }
        }
        return filtered
      })
      setDeleteConfirm(null)
      setDetailImage(null)
      toast.success("Görsel silindi")
    },
    [productId]
  )

  // Drag reorder handlers
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleDragOverItem = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      setDragOverIndex(index)
    },
    []
  )

  const handleDropItem = useCallback(
    async (targetIndex: number) => {
      if (dragIndex === null || dragIndex === targetIndex) {
        setDragIndex(null)
        setDragOverIndex(null)
        return
      }

      setImages((prev) => {
        const next = [...prev]
        const [moved] = next.splice(dragIndex, 1)
        next.splice(targetIndex, 0, moved)
        return next.map((img, i) => ({ ...img, sortOrder: i }))
      })

      setDragIndex(null)
      setDragOverIndex(null)

      // Save new order to DB
      if (productId) {
        setSaving(true)
        try {
          const reordered = [...images]
          const [moved] = reordered.splice(dragIndex, 1)
          reordered.splice(targetIndex, 0, moved)
          const updates = reordered
            .map((img, i) => ({
              id: isProductImage(img) ? img.id : "",
              sortOrder: i,
              isFeatured: img.isFeatured,
              altText: img.altText,
              title: img.title,
              description: img.description,
            }))
            .filter((i) => i.id)

          await fetch(`/api/admin/products/${productId}/images`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images: updates }),
          })
        } catch {
          toast.error("Sıralama kaydedilemedi")
        } finally {
          setSaving(false)
        }
      }
    },
    [dragIndex, images, productId]
  )

  // Update image detail fields
  const updateImageDetail = useCallback(
    (key: string, field: string, value: string) => {
      setImages((prev) =>
        prev.map((img) =>
          getKey(img) === key ? { ...img, [field]: value } : img
        )
      )
      // Also update detailImage
      setDetailImage((prev) =>
        prev && getKey(prev) === key ? { ...prev, [field]: value } : prev
      )
    },
    []
  )

  // Save detail changes
  const saveDetail = useCallback(async () => {
    if (!detailImage || !productId || !isProductImage(detailImage)) return
    setSaving(true)
    try {
      const allImages = images.map((img) => ({
        id: isProductImage(img) ? img.id : "",
        sortOrder: img.sortOrder,
        isFeatured: img.isFeatured,
        altText: img.altText,
        title: img.title,
        description: img.description,
      })).filter((i) => i.id)

      await fetch(`/api/admin/products/${productId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: allImages }),
      })
      toast.success("Görsel bilgileri güncellendi")
    } catch {
      toast.error("Güncellenemedi")
    } finally {
      setSaving(false)
    }
    setDetailImage(null)
  }, [detailImage, images, productId])

  const featuredImage = images.find((img) => img.isFeatured) || images[0]

  const progressEntries = Object.entries(uploadProgress)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ürün Görselleri</CardTitle>
          <span className="text-sm text-muted-foreground">
            {images.length}/{MAX_IMAGES} görsel
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Featured Image Preview */}
        {featuredImage && (
          <div className="relative group">
            <div className="relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuredImage.url}
                alt={featuredImage.altText || "Ana görsel"}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Ana Görsel
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        {images.length < MAX_IMAGES && (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files)
                e.target.value = ""
              }}
            />
            <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              Görselleri sürükleyin veya tıklayın
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WEBP, GIF - Maks. 5MB - En fazla {MAX_IMAGES} görsel
            </p>
          </div>
        )}

        {/* Upload Progress */}
        {progressEntries.length > 0 && (
          <div className="space-y-2">
            {progressEntries.map(([id, progress]) => (
              <div key={id} className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  %{progress}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((img, index) => (
              <div
                key={getKey(img)}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOverItem(e, index)}
                onDrop={() => handleDropItem(index)}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                className={`group relative aspect-square rounded-lg border overflow-hidden bg-muted cursor-move transition-all ${
                  dragOverIndex === index
                    ? "ring-2 ring-primary scale-105"
                    : ""
                } ${dragIndex === index ? "opacity-50" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.altText || "Ürün görseli"}
                  className="w-full h-full object-cover"
                />

                {/* Drag handle */}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/60 rounded p-0.5">
                    <GripVertical className="size-3.5 text-white" />
                  </div>
                </div>

                {/* Featured star */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFeatured(img)
                  }}
                  className={`absolute top-1 right-1 transition-opacity ${
                    img.isFeatured
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  title={
                    img.isFeatured ? "Ana görsel" : "Ana görsel yap"
                  }
                >
                  <Star
                    className={`size-5 ${
                      img.isFeatured
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-white drop-shadow"
                    }`}
                  />
                </button>

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setDetailImage(img)}
                    className="bg-white/90 rounded-full p-1.5 hover:bg-white transition-colors"
                  >
                    <ZoomIn className="size-4 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(img)
                    }}
                    className="bg-white/90 rounded-full p-1.5 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="size-4 text-red-600" />
                  </button>
                </div>

                {/* Sort order badge */}
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {images.length === 0 && !uploading && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ImageIcon className="size-12 mb-2 opacity-40" />
            <p className="text-sm">Henüz görsel eklenmemiş</p>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog
          open={!!detailImage}
          onOpenChange={(open) => {
            if (!open) {
              if (productId && detailImage && isProductImage(detailImage)) {
                saveDetail()
              } else {
                setDetailImage(null)
              }
            }
          }}
        >
          {detailImage && (
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Görsel Detayları</DialogTitle>
                <DialogDescription>
                  Görsel bilgilerini düzenleyin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detailImage.url}
                    alt={detailImage.altText || "Görsel"}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="img-alt">Alt Metin</Label>
                    <Input
                      id="img-alt"
                      value={detailImage.altText || ""}
                      onChange={(e) =>
                        updateImageDetail(
                          getKey(detailImage),
                          "altText",
                          e.target.value
                        )
                      }
                      placeholder="Görsel açıklaması (SEO için önemli)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="img-title">Başlık</Label>
                    <Input
                      id="img-title"
                      value={detailImage.title || ""}
                      onChange={(e) =>
                        updateImageDetail(
                          getKey(detailImage),
                          "title",
                          e.target.value
                        )
                      }
                      placeholder="Görsel başlığı"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="img-desc">Açıklama</Label>
                    <Textarea
                      id="img-desc"
                      value={detailImage.description || ""}
                      onChange={(e) =>
                        updateImageDetail(
                          getKey(detailImage),
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Görsel açıklaması"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!detailImage.isFeatured) {
                      setFeatured(detailImage)
                      toast.success("Ana görsel değiştirildi")
                    }
                  }}
                  disabled={detailImage.isFeatured}
                >
                  <Star className="size-4 mr-1.5" />
                  {detailImage.isFeatured
                    ? "Zaten Ana Görsel"
                    : "Ana Görsel Yap"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setDetailImage(null)
                    setDeleteConfirm(detailImage)
                  }}
                >
                  <Trash2 className="size-4 mr-1.5" />
                  Sil
                </Button>
                {productId && isProductImage(detailImage) && (
                  <Button
                    type="button"
                    onClick={saveDetail}
                    disabled={saving}
                  >
                    Kaydet
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirm}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirm(null)
          }}
        >
          {deleteConfirm && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Görseli Sil</DialogTitle>
                <DialogDescription>
                  Bu görseli silmek istediğinizden emin misiniz? Bu işlem geri
                  alınamaz.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  Sil
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  )
}

export type { PendingImage }
