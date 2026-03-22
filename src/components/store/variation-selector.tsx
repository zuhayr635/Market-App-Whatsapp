"use client"

import { useState, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"

interface VariationValue {
  id: string
  variationTypeId: string
  value: string
  colorCode?: string | null
  image?: string | null
  sortOrder: number
}

interface VariationType {
  id: string
  name: string
  displayType: string
  sortOrder: number
  values: VariationValue[]
}

interface ProductVariation {
  id: string
  combination: Record<string, string>
  priceDiff: number | null
  salePrice: number | null
  stock: number
  imageUrl: string | null
  sku: string | null
}

interface VariationSelectorProps {
  variationTypes: VariationType[]
  variations: ProductVariation[]
  onChange: (selected: Record<string, string>, variation: ProductVariation | null) => void
}

export function VariationSelector({
  variationTypes,
  variations,
  onChange,
}: VariationSelectorProps) {
  const [selected, setSelected] = useState<Record<string, string>>({})

  // Determine which variation type names are actually used in product variations
  const usedTypeNames = useMemo(() => {
    const names = new Set<string>()
    for (const v of variations) {
      if (v.combination && typeof v.combination === "object") {
        for (const key of Object.keys(v.combination)) {
          names.add(key)
        }
      }
    }
    return names
  }, [variations])

  // Filter variation types to only those used in this product
  const activeTypes = useMemo(
    () => variationTypes.filter((vt) => usedTypeNames.has(vt.name)),
    [variationTypes, usedTypeNames]
  )

  // Get available values for each type based on current selections
  const getAvailableValues = useCallback(
    (typeName: string): Set<string> => {
      const available = new Set<string>()
      for (const variation of variations) {
        if (variation.stock <= 0) continue
        const combo = variation.combination
        let matches = true
        for (const [key, value] of Object.entries(selected)) {
          if (key !== typeName && combo[key] !== value) {
            matches = false
            break
          }
        }
        if (matches && combo[typeName]) {
          available.add(combo[typeName])
        }
      }
      return available
    },
    [variations, selected]
  )

  // Find matching variation for current selection
  const findMatchingVariation = useCallback(
    (sel: Record<string, string>): ProductVariation | null => {
      if (Object.keys(sel).length !== activeTypes.length) return null
      return (
        variations.find((v) => {
          const combo = v.combination
          return activeTypes.every((t) => combo[t.name] === sel[t.name])
        }) || null
      )
    },
    [variations, activeTypes]
  )

  // Get unique values used for a type across all variations
  const getUsedValues = useCallback(
    (typeName: string): string[] => {
      const values = new Set<string>()
      for (const v of variations) {
        if (v.combination[typeName]) {
          values.add(v.combination[typeName])
        }
      }
      return Array.from(values)
    },
    [variations]
  )

  const handleSelect = (typeName: string, value: string) => {
    const newSelected = { ...selected }
    if (newSelected[typeName] === value) {
      delete newSelected[typeName]
    } else {
      newSelected[typeName] = value
    }
    setSelected(newSelected)
    const matchingVariation = findMatchingVariation(newSelected)
    onChange(newSelected, matchingVariation)
  }

  if (activeTypes.length === 0) return null

  return (
    <div className="space-y-4">
      {activeTypes.map((vType) => {
        const available = getAvailableValues(vType.name)
        const usedValues = getUsedValues(vType.name)
        // Map value names to variation value objects for color/image info
        const valueMap = new Map<string, VariationValue>()
        for (const val of vType.values) {
          valueMap.set(val.value, val)
        }

        return (
          <div key={vType.id}>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {vType.name}
              {selected[vType.name] && (
                <span className="ml-2 font-normal text-muted-foreground">
                  {selected[vType.name]}
                </span>
              )}
            </label>

            {vType.displayType === "color_swatch" ? (
              <div className="flex flex-wrap gap-2">
                {usedValues.map((valueName) => {
                  const valObj = valueMap.get(valueName)
                  const isAvailable = available.has(valueName)
                  const isSelected = selected[vType.name] === valueName

                  return (
                    <button
                      key={valueName}
                      onClick={() => handleSelect(vType.name, valueName)}
                      disabled={!isAvailable && !isSelected}
                      title={valueName}
                      className={cn(
                        "relative h-9 w-9 rounded-full border-2 transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary/30 scale-110"
                          : "border-gray-200 hover:border-gray-400",
                        !isAvailable && !isSelected && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <span
                        className="absolute inset-[3px] rounded-full shadow-inner"
                        style={{
                          backgroundColor: valObj?.colorCode || "#ccc",
                        }}
                      />
                      {!isAvailable && !isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="block h-[1px] w-full rotate-45 bg-gray-400" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : vType.displayType === "button" ? (
              <div className="flex flex-wrap gap-2">
                {usedValues.map((valueName) => {
                  const isAvailable = available.has(valueName)
                  const isSelected = selected[vType.name] === valueName

                  return (
                    <button
                      key={valueName}
                      onClick={() => handleSelect(vType.name, valueName)}
                      disabled={!isAvailable && !isSelected}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/50",
                        !isAvailable && !isSelected && "opacity-40 cursor-not-allowed line-through"
                      )}
                    >
                      {valueName}
                    </button>
                  )
                })}
              </div>
            ) : (
              /* dropdown */
              <select
                value={selected[vType.name] || ""}
                onChange={(e) => {
                  const val = e.target.value
                  if (val) {
                    handleSelect(vType.name, val)
                  } else {
                    const newSelected = { ...selected }
                    delete newSelected[vType.name]
                    setSelected(newSelected)
                    onChange(newSelected, null)
                  }
                }}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="">{vType.name} seçiniz</option>
                {usedValues.map((valueName) => {
                  const isAvailable = available.has(valueName)
                  return (
                    <option
                      key={valueName}
                      value={valueName}
                      disabled={!isAvailable}
                    >
                      {valueName} {!isAvailable ? "(Tükendi)" : ""}
                    </option>
                  )
                })}
              </select>
            )}
          </div>
        )
      })}
    </div>
  )
}
