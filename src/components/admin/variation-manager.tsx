"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Plus,
  Trash2,
  Loader2,
  X,
  Palette,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

// ---------- Types ----------

interface VariationValue {
  id?: string
  value: string
  colorCode?: string | null
  image?: string | null
  sortOrder: number
  status: boolean
  selected?: boolean // UI-only: whether this value is selected for the product
}

interface VariationType {
  id: string
  name: string
  displayType: string
  sortOrder: number
  status: boolean
  values: VariationValue[]
}

interface CombinationRow {
  tempId: string
  combination: Record<string, string>
  sku: string
  priceDiff: number | null
  salePrice: number | null
  stock: number
  weight: number | null
  imageUrl: string
  description: string
  status: boolean
}

interface VariationManagerProps {
  productId?: string
  onChange?: (hasVariations: boolean, combinations: CombinationRow[]) => void
}

// ---------- Helpers ----------

const selectClass =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function combinationLabel(combo: Record<string, string>): string {
  return Object.values(combo).join(" / ")
}

function generateTempId(): string {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ---------- Main Component ----------

export function VariationManager({
  productId,
  onChange,
}: VariationManagerProps) {
  const [hasVariations, setHasVariations] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // All available variation types from the server
  const [allTypes, setAllTypes] = useState<VariationType[]>([])

  // Types selected for this product with their selected values
  const [selectedTypes, setSelectedTypes] = useState<
    (VariationType & { selectedValueIds: Set<string> })[]
  >([])

  // Combinations table
  const [combinations, setCombinations] = useState<CombinationRow[]>([])

  // New type creation inline form
  const [showNewTypeForm, setShowNewTypeForm] = useState(false)
  const [newTypeName, setNewTypeName] = useState("")
  const [newTypeDisplayType, setNewTypeDisplayType] = useState("dropdown")
  const [creatingType, setCreatingType] = useState(false)

  // New value inline form per type
  const [newValueForms, setNewValueForms] = useState<
    Record<string, { value: string; colorCode: string }>
  >({})

  // Bulk edit
  const [bulkStock, setBulkStock] = useState("")
  const [bulkPriceDiff, setBulkPriceDiff] = useState("")

  // Fetch all variation types
  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/variations")
      if (res.ok) {
        const data: VariationType[] = await res.json()
        setAllTypes(data)
      }
    } catch {
      // silent
    }
  }, [])

  // Fetch existing product variations
  const fetchProductVariations = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/variations`)
      if (res.ok) {
        const data: Array<{
          id: string
          combination: Record<string, string>
          sku: string | null
          priceDiff: string | number | null
          salePrice: string | number | null
          stock: number
          weight: string | number | null
          imageUrl: string | null
          description: string | null
          status: boolean
        }> = await res.json()

        if (data.length > 0) {
          setHasVariations(true)
          setCombinations(
            data.map((v) => ({
              tempId: v.id,
              combination: v.combination,
              sku: v.sku || "",
              priceDiff: v.priceDiff != null ? Number(v.priceDiff) : null,
              salePrice: v.salePrice != null ? Number(v.salePrice) : null,
              stock: v.stock,
              weight: v.weight != null ? Number(v.weight) : null,
              imageUrl: v.imageUrl || "",
              description: v.description || "",
              status: v.status,
            }))
          )

          // Reconstruct selected types from combinations
          // We'll do this after types are loaded
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchTypes()
  }, [fetchTypes])

  useEffect(() => {
    fetchProductVariations()
  }, [fetchProductVariations])

  // After both types and product variations are loaded, reconstruct selected types
  useEffect(() => {
    if (combinations.length > 0 && allTypes.length > 0 && selectedTypes.length === 0) {
      // Extract variation type names and values from combinations
      const typeValueMap: Record<string, Set<string>> = {}
      for (const combo of combinations) {
        for (const [typeName, value] of Object.entries(combo.combination)) {
          if (!typeValueMap[typeName]) typeValueMap[typeName] = new Set()
          typeValueMap[typeName].add(value)
        }
      }

      const reconstructed: (VariationType & { selectedValueIds: Set<string> })[] = []
      for (const [typeName, values] of Object.entries(typeValueMap)) {
        const matchedType = allTypes.find((t) => t.name === typeName)
        if (matchedType) {
          const selectedValueIds = new Set<string>()
          Array.from(values).forEach((val) => {
            const matchedValue = matchedType.values.find((v) => v.value === val)
            if (matchedValue && matchedValue.id) {
              selectedValueIds.add(matchedValue.id)
            }
          })
          reconstructed.push({ ...matchedType, selectedValueIds })
        }
      }
      if (reconstructed.length > 0) {
        setSelectedTypes(reconstructed)
      }
    }
  }, [combinations, allTypes, selectedTypes.length])

  // Notify parent of changes
  useEffect(() => {
    onChange?.(hasVariations, combinations)
  }, [hasVariations, combinations, onChange])

  // ---------- Actions ----------

  const handleAddType = (typeId: string) => {
    if (typeId === "__new__") {
      setShowNewTypeForm(true)
      return
    }
    const type = allTypes.find((t) => t.id === typeId)
    if (!type) return
    if (selectedTypes.find((t) => t.id === typeId)) return

    setSelectedTypes((prev) => [
      ...prev,
      { ...type, selectedValueIds: new Set() },
    ])
  }

  const handleRemoveType = (typeId: string) => {
    setSelectedTypes((prev) => prev.filter((t) => t.id !== typeId))
  }

  const handleToggleValue = (typeId: string, valueId: string) => {
    setSelectedTypes((prev) =>
      prev.map((t) => {
        if (t.id !== typeId) return t
        const next = new Set(t.selectedValueIds)
        if (next.has(valueId)) next.delete(valueId)
        else next.add(valueId)
        return { ...t, selectedValueIds: next }
      })
    )
  }

  const handleCreateNewType = async () => {
    if (!newTypeName.trim()) return
    setCreatingType(true)
    try {
      const res = await fetch("/api/admin/variations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTypeName.trim(),
          displayType: newTypeDisplayType,
          values: [],
        }),
      })
      if (res.ok) {
        const created: VariationType = await res.json()
        setAllTypes((prev) => [...prev, created])
        setSelectedTypes((prev) => [
          ...prev,
          { ...created, selectedValueIds: new Set() },
        ])
        setNewTypeName("")
        setNewTypeDisplayType("dropdown")
        setShowNewTypeForm(false)
        toast.success("Varyasyon tipi oluşturuldu")
      } else {
        const err = await res.json()
        toast.error(err.error || "Hata oluştu")
      }
    } catch {
      toast.error("Hata oluştu")
    } finally {
      setCreatingType(false)
    }
  }

  const handleAddNewValue = async (typeId: string) => {
    const form = newValueForms[typeId]
    if (!form || !form.value.trim()) return

    const type = allTypes.find((t) => t.id === typeId)
    if (!type) return

    const updatedValues = [
      ...type.values,
      {
        value: form.value.trim(),
        colorCode: form.colorCode || null,
        sortOrder: type.values.length,
      },
    ]

    try {
      const res = await fetch(`/api/admin/variations/${typeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: type.name,
          displayType: type.displayType,
          values: updatedValues.map((v) => ({
            ...(("id" in v && v.id) ? { id: v.id } : {}),
            value: v.value,
            colorCode: v.colorCode || null,
            sortOrder: v.sortOrder,
          })),
        }),
      })

      if (res.ok) {
        const updated: VariationType = await res.json()
        setAllTypes((prev) => prev.map((t) => (t.id === typeId ? updated : t)))
        setSelectedTypes((prev) =>
          prev.map((t) =>
            t.id === typeId
              ? { ...updated, selectedValueIds: t.selectedValueIds }
              : t
          )
        )
        setNewValueForms((prev) => ({
          ...prev,
          [typeId]: { value: "", colorCode: "" },
        }))
        toast.success("Değer eklendi")
      }
    } catch {
      toast.error("Hata oluştu")
    }
  }

  const handleGenerateCombinations = () => {
    // Get selected values for each type
    const typeValues: { typeName: string; values: string[] }[] = []

    for (const st of selectedTypes) {
      const vals = st.values
        .filter((v) => v.id && st.selectedValueIds.has(v.id))
        .map((v) => v.value)
      if (vals.length === 0) continue
      typeValues.push({ typeName: st.name, values: vals })
    }

    if (typeValues.length === 0) {
      toast.error("En az bir varyasyon tipi ve değeri seçin")
      return
    }

    // Generate cartesian product
    const cartesian = (
      arr: { typeName: string; values: string[] }[]
    ): Record<string, string>[] => {
      if (arr.length === 0) return [{}]
      const [first, ...rest] = arr
      const restCombos = cartesian(rest)
      const result: Record<string, string>[] = []
      for (const val of first.values) {
        for (const combo of restCombos) {
          result.push({ [first.typeName]: val, ...combo })
        }
      }
      return result
    }

    const newCombos = cartesian(typeValues)

    // Preserve existing combination data if the combination already exists
    const existingMap = new Map<string, CombinationRow>()
    for (const row of combinations) {
      existingMap.set(JSON.stringify(row.combination), row)
    }

    const merged: CombinationRow[] = newCombos.map((combo) => {
      const key = JSON.stringify(combo)
      const existing = existingMap.get(key)
      if (existing) return existing
      return {
        tempId: generateTempId(),
        combination: combo,
        sku: "",
        priceDiff: null,
        salePrice: null,
        stock: 0,
        weight: null,
        imageUrl: "",
        description: "",
        status: true,
      }
    })

    setCombinations(merged)
    toast.success(`${merged.length} kombinasyon oluşturuldu`)
  }

  const handleUpdateCombination = (
    tempId: string,
    field: keyof CombinationRow,
    value: string | number | boolean | null
  ) => {
    setCombinations((prev) =>
      prev.map((row) =>
        row.tempId === tempId ? { ...row, [field]: value } : row
      )
    )
  }

  const handleDeleteCombination = (tempId: string) => {
    setCombinations((prev) => prev.filter((row) => row.tempId !== tempId))
  }

  const handleBulkSetStock = () => {
    const val = parseInt(bulkStock, 10)
    if (isNaN(val)) return
    setCombinations((prev) => prev.map((row) => ({ ...row, stock: val })))
    setBulkStock("")
    toast.success("Tüm stoklar güncellendi")
  }

  const handleBulkSetPriceDiff = () => {
    const val = parseFloat(bulkPriceDiff)
    if (isNaN(val)) return
    setCombinations((prev) =>
      prev.map((row) => ({ ...row, priceDiff: val }))
    )
    setBulkPriceDiff("")
    toast.success("Tüm fiyat farkları güncellendi")
  }

  const handleSaveVariations = async () => {
    if (!productId) {
      toast.error("Varyasyonları kaydetmek için önce ürünü kaydedin")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/variations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variations: combinations.map((row) => ({
            combination: row.combination,
            sku: row.sku || null,
            priceDiff: row.priceDiff,
            salePrice: row.salePrice,
            stock: row.stock,
            weight: row.weight,
            imageUrl: row.imageUrl || null,
            description: row.description || null,
            status: row.status,
          })),
        }),
      })

      if (res.ok) {
        const saved = await res.json()
        setCombinations(
          saved.map(
            (v: {
              id: string
              combination: Record<string, string>
              sku: string | null
              priceDiff: string | number | null
              salePrice: string | number | null
              stock: number
              weight: string | number | null
              imageUrl: string | null
              description: string | null
              status: boolean
            }) => ({
              tempId: v.id,
              combination: v.combination,
              sku: v.sku || "",
              priceDiff: v.priceDiff != null ? Number(v.priceDiff) : null,
              salePrice: v.salePrice != null ? Number(v.salePrice) : null,
              stock: v.stock,
              weight: v.weight != null ? Number(v.weight) : null,
              imageUrl: v.imageUrl || "",
              description: v.description || "",
              status: v.status,
            })
          )
        )
        toast.success("Varyasyonlar kaydedildi")
      } else {
        const err = await res.json()
        toast.error(err.error || "Hata oluştu")
      }
    } catch {
      toast.error("Hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  // ---------- Summary ----------

  const totalStock = combinations.reduce((sum, r) => sum + r.stock, 0)

  // ---------- Render ----------

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="size-4" />
          Varyasyonlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle: Has variations? */}
        <div className="space-y-2">
          <Label>Bu ürünün varyasyonları var mı?</Label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                checked={!hasVariations}
                onChange={() => setHasVariations(false)}
                className="accent-primary"
              />
              Hayır
            </label>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                checked={hasVariations}
                onChange={() => setHasVariations(true)}
                className="accent-primary"
              />
              Evet
            </label>
          </div>
        </div>

        {hasVariations && (
          <div className="space-y-6 pt-2 border-t">
            {/* Type Selection */}
            <div className="space-y-3">
              <Label>Varyasyon Tipi Ekle</Label>
              <select
                className={selectClass}
                value=""
                onChange={(e) => {
                  if (e.target.value) handleAddType(e.target.value)
                }}
              >
                <option value="">Varyasyon tipi seçin...</option>
                {allTypes
                  .filter(
                    (t) => t.status && !selectedTypes.find((s) => s.id === t.id)
                  )
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                <option value="__new__">+ Yeni Oluştur</option>
              </select>
            </div>

            {/* New Type Form */}
            {showNewTypeForm && (
              <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Yeni Varyasyon Tipi
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowNewTypeForm(false)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Ad</Label>
                    <Input
                      placeholder="Örn: Renk, Beden"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Görünüm</Label>
                    <select
                      className={selectClass}
                      value={newTypeDisplayType}
                      onChange={(e) => setNewTypeDisplayType(e.target.value)}
                    >
                      <option value="dropdown">Dropdown</option>
                      <option value="color_swatch">Renk Paleti</option>
                      <option value="button">Buton</option>
                    </select>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={creatingType || !newTypeName.trim()}
                  onClick={handleCreateNewType}
                >
                  {creatingType && (
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  )}
                  Oluştur
                </Button>
              </div>
            )}

            {/* Selected Types with Value Selection */}
            {selectedTypes.map((st) => {
              const isColorSwatch = st.displayType === "color_swatch"
              const form = newValueForms[st.id] || {
                value: "",
                colorCode: "",
              }

              return (
                <div
                  key={st.id}
                  className="rounded-lg border bg-white p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isColorSwatch && (
                        <Palette className="size-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{st.name}</span>
                      <span className="text-xs text-muted-foreground">
                        (
                        {st.displayType === "color_swatch"
                          ? "Renk Paleti"
                          : st.displayType === "button"
                          ? "Buton"
                          : "Dropdown"}
                        )
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveType(st.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>

                  {/* Values as selectable chips */}
                  <div className="flex flex-wrap gap-2">
                    {st.values
                      .filter((v) => v.status)
                      .map((v) => {
                        const isSelected = v.id
                          ? st.selectedValueIds.has(v.id)
                          : false
                        return (
                          <button
                            key={v.id || v.value}
                            type="button"
                            onClick={() =>
                              v.id && handleToggleValue(st.id, v.id)
                            }
                            className={`
                              inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium
                              border transition-colors cursor-pointer
                              ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-white text-foreground border-input hover:bg-gray-50"
                              }
                            `}
                          >
                            {isColorSwatch && v.colorCode && (
                              <span
                                className="inline-block size-3 rounded-full border border-white/50"
                                style={{ backgroundColor: v.colorCode }}
                              />
                            )}
                            {v.value}
                          </button>
                        )
                      })}
                  </div>

                  {/* Add new value */}
                  <div className="flex items-end gap-2 pt-1">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Yeni Değer</Label>
                      <Input
                        placeholder="Değer adı"
                        className="h-7 text-xs"
                        value={form.value}
                        onChange={(e) =>
                          setNewValueForms((prev) => ({
                            ...prev,
                            [st.id]: { ...form, value: e.target.value },
                          }))
                        }
                      />
                    </div>
                    {isColorSwatch && (
                      <div className="space-y-1">
                        <Label className="text-xs">Renk Kodu</Label>
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={form.colorCode || "#000000"}
                            onChange={(e) =>
                              setNewValueForms((prev) => ({
                                ...prev,
                                [st.id]: {
                                  ...form,
                                  colorCode: e.target.value,
                                },
                              }))
                            }
                            className="h-7 w-7 rounded border cursor-pointer"
                          />
                          <Input
                            placeholder="#000000"
                            className="h-7 text-xs w-24"
                            value={form.colorCode}
                            onChange={(e) =>
                              setNewValueForms((prev) => ({
                                ...prev,
                                [st.id]: {
                                  ...form,
                                  colorCode: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7"
                      disabled={!form.value.trim()}
                      onClick={() => handleAddNewValue(st.id)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Generate Combinations Button */}
            {selectedTypes.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateCombinations}
                className="w-full"
              >
                Tüm Kombinasyonları Oluştur
              </Button>
            )}

            {/* Combinations Table */}
            {combinations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Kombinasyonlar ({combinations.length})
                  </h4>
                  {/* Bulk Actions */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="Toplu stok"
                        className="h-7 w-24 text-xs"
                        value={bulkStock}
                        onChange={(e) => setBulkStock(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={handleBulkSetStock}
                      >
                        Uygula
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Toplu fiyat farkı"
                        className="h-7 w-28 text-xs"
                        value={bulkPriceDiff}
                        onChange={(e) => setBulkPriceDiff(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={handleBulkSetPriceDiff}
                      >
                        Uygula
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          Kombinasyon
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          SKU
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          Fiyat Farkı
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                          Stok
                        </th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground">
                          Aktif
                        </th>
                        <th className="text-center px-3 py-2 font-medium text-muted-foreground w-10">
                          Sil
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinations.map((row) => (
                        <tr
                          key={row.tempId}
                          className="border-b last:border-b-0 hover:bg-gray-50/50"
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {/* Show color swatches if applicable */}
                              {Object.entries(row.combination).map(
                                ([typeName, value]) => {
                                  const type = allTypes.find(
                                    (t) => t.name === typeName
                                  )
                                  const val = type?.values.find(
                                    (v) => v.value === value
                                  )
                                  if (
                                    type?.displayType === "color_swatch" &&
                                    val?.colorCode
                                  ) {
                                    return (
                                      <span
                                        key={typeName}
                                        className="inline-block size-3.5 rounded-full border border-gray-200"
                                        style={{
                                          backgroundColor: val.colorCode,
                                        }}
                                        title={`${typeName}: ${value}`}
                                      />
                                    )
                                  }
                                  return null
                                }
                              )}
                              <span className="font-medium">
                                {combinationLabel(row.combination)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-6 text-xs w-28"
                              placeholder="SKU"
                              value={row.sku}
                              onChange={(e) =>
                                handleUpdateCombination(
                                  row.tempId,
                                  "sku",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              className="h-6 text-xs w-24"
                              placeholder="0.00"
                              value={
                                row.priceDiff != null ? row.priceDiff : ""
                              }
                              onChange={(e) => {
                                const v = e.target.value
                                handleUpdateCombination(
                                  row.tempId,
                                  "priceDiff",
                                  v === "" ? null : parseFloat(v)
                                )
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min="0"
                              className="h-6 text-xs w-20"
                              value={row.stock}
                              onChange={(e) =>
                                handleUpdateCombination(
                                  row.tempId,
                                  "stock",
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Checkbox
                              checked={row.status}
                              onCheckedChange={(checked: boolean) =>
                                handleUpdateCombination(
                                  row.tempId,
                                  "status",
                                  checked
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                handleDeleteCombination(row.tempId)
                              }
                            >
                              <Trash2 className="size-3 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
                  <div className="text-muted-foreground">
                    Toplam: <strong>{combinations.length}</strong> kombinasyon,{" "}
                    <strong>{totalStock}</strong> adet stok
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={handleSaveVariations}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving && (
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    )}
                    Varyasyonları Kaydet
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
