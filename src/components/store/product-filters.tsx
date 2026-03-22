"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface CategoryFilter {
  id: string
  name: string
  slug: string
  parentId: string | null
  _count: { products: number }
  children?: CategoryFilter[]
}

interface BrandFilter {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

interface FilterState {
  categorySlug: string
  minPrice: string
  maxPrice: string
  brandId: string
  inStock: boolean
}

interface ProductFiltersProps {
  categories: CategoryFilter[]
  brands: BrandFilter[]
  priceRange: { min: number; max: number }
  filters: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  onClearFilters: () => void
}

export function ProductFilters({
  categories,
  brands,
  priceRange,
  filters,
  onFilterChange,
  onClearFilters,
}: ProductFiltersProps) {
  const hasActiveFilters =
    filters.categorySlug ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.brandId ||
    filters.inStock

  return (
    <div className="space-y-6">
      {/* Active filters */}
      {hasActiveFilters && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Aktif Filtreler</h3>
            <Button variant="ghost" size="xs" onClick={onClearFilters}>
              <X className="mr-1 h-3 w-3" />
              Temizle
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.categorySlug && (
              <FilterChip
                label={
                  categories.find((c) => c.slug === filters.categorySlug)?.name ||
                  categories
                    .flatMap((c) => c.children || [])
                    .find((c) => c.slug === filters.categorySlug)?.name ||
                  filters.categorySlug
                }
                onRemove={() => onFilterChange({ categorySlug: "" })}
              />
            )}
            {filters.brandId && (
              <FilterChip
                label={brands.find((b) => b.id === filters.brandId)?.name || "Marka"}
                onRemove={() => onFilterChange({ brandId: "" })}
              />
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <FilterChip
                label={`$${filters.minPrice || "0"} - $${filters.maxPrice || "..."}`}
                onRemove={() => onFilterChange({ minPrice: "", maxPrice: "" })}
              />
            )}
            {filters.inStock && (
              <FilterChip
                label="Stokta var"
                onRemove={() => onFilterChange({ inStock: false })}
              />
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <FilterSection title="Kategoriler" defaultOpen>
          <div className="space-y-1">
            {categories.map((cat) => (
              <CategoryItem
                key={cat.id}
                category={cat}
                selectedSlug={filters.categorySlug}
                onSelect={(slug) =>
                  onFilterChange({ categorySlug: slug === filters.categorySlug ? "" : slug })
                }
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price range */}
      <FilterSection title="Fiyat Araligi" defaultOpen>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={`Min ($${priceRange.min})`}
              value={filters.minPrice}
              onChange={(e) => onFilterChange({ minPrice: e.target.value })}
              className="h-8 text-sm"
              min={0}
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder={`Max ($${priceRange.max})`}
              value={filters.maxPrice}
              onChange={(e) => onFilterChange({ maxPrice: e.target.value })}
              className="h-8 text-sm"
              min={0}
            />
          </div>
        </div>
      </FilterSection>

      {/* Brands */}
      {brands.length > 0 && (
        <FilterSection title="Marka" defaultOpen={brands.length <= 10}>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {brands.map((brand) => (
              <label
                key={brand.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 hover:bg-muted"
              >
                <Checkbox
                  checked={filters.brandId === brand.id}
                  onCheckedChange={(checked) =>
                    onFilterChange({ brandId: checked ? brand.id : "" })
                  }
                />
                <span className="flex-1 text-sm">{brand.name}</span>
                <span className="text-xs text-muted-foreground">({brand._count.products})</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Stock filter */}
      <FilterSection title="Stok Durumu" defaultOpen>
        <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 hover:bg-muted">
          <Checkbox
            checked={filters.inStock}
            onCheckedChange={(checked) => onFilterChange({ inStock: !!checked })}
          />
          <span className="text-sm">Sadece stoktakileri goster</span>
        </label>
      </FilterSection>

      {/* Clear all */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={onClearFilters}>
          Filtreleri Temizle
        </Button>
      )}
    </div>
  )
}

function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b pb-4 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-sm font-semibold text-foreground"
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

function CategoryItem({
  category,
  selectedSlug,
  onSelect,
  depth = 0,
}: {
  category: CategoryFilter
  selectedSlug: string
  onSelect: (slug: string) => void
  depth?: number
}) {
  const [expanded, setExpanded] = useState(
    category.slug === selectedSlug ||
      (category.children || []).some((c) => c.slug === selectedSlug)
  )
  const hasChildren = category.children && category.children.length > 0
  const isSelected = category.slug === selectedSlug

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 rounded-md py-1 text-sm transition-colors",
          isSelected ? "font-medium text-blue-600" : "text-foreground hover:text-blue-600"
        )}
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-5 w-5 shrink-0 items-center justify-center"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <button
          onClick={() => onSelect(category.slug)}
          className="flex flex-1 items-center justify-between"
        >
          <span>{category.name}</span>
          <span className="text-xs text-muted-foreground">({category._count.products})</span>
        </button>
      </div>
      {hasChildren && expanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              selectedSlug={selectedSlug}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
