"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { LayoutGrid, List, SlidersHorizontal, PackageSearch, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Breadcrumb } from "@/components/store/breadcrumb"
import { ProductCard, type ProductCardData } from "@/components/store/product-card"
import { ProductFilters } from "@/components/store/product-filters"
import { ProductSort } from "@/components/store/product-sort"
import { Pagination } from "@/components/store/pagination"

interface CategoryInfo {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  parentId?: string | null
  children: Array<{
    id: string
    name: string
    slug: string
    image?: string | null
    description?: string | null
    _count: { products: number }
  }>
  parent?: { id: string; name: string; slug: string } | null
}

interface FiltersData {
  categories: Array<{
    id: string
    name: string
    slug: string
    parentId: string | null
    _count: { products: number }
    children?: Array<{
      id: string
      name: string
      slug: string
      parentId: string | null
      _count: { products: number }
    }>
  }>
  brands: Array<{
    id: string
    name: string
    slug: string
    _count: { products: number }
  }>
  priceRange: { min: number; max: number }
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<CategoryPageFallback />}>
      <CategoryPageContent />
    </Suspense>
  )
}

function CategoryPageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 h-8 w-56 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-xl border">
            <div className="aspect-square bg-gray-200" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-5 w-20 rounded bg-gray-200" />
              <div className="h-8 w-full rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryPageContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  const [products, setProducts] = useState<ProductCardData[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filtersData, setFiltersData] = useState<FiltersData>({
    categories: [],
    brands: [],
    priceRange: { min: 0, max: 0 },
  })
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Read filter state from URL
  const page = parseInt(searchParams.get("page") || "1")
  const sort = searchParams.get("sort") || "newest"
  const search = searchParams.get("search") || ""
  const minPrice = searchParams.get("minPrice") || ""
  const maxPrice = searchParams.get("maxPrice") || ""
  const brandId = searchParams.get("brandId") || ""
  const inStock = searchParams.get("inStock") === "true"

  const filters = {
    categorySlug: slug,
    minPrice,
    maxPrice,
    brandId,
    inStock,
  }

  const basePath = `/kategori/${slug}`

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "false") {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      if (!("page" in updates)) {
        params.delete("page")
      }
      const qs = params.toString()
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
    },
    [searchParams, router, basePath]
  )

  const handleFilterChange = useCallback(
    (update: Partial<{ categorySlug: string; minPrice: string; maxPrice: string; brandId: string; inStock: boolean }>) => {
      // If category changes, navigate to that category page
      if ("categorySlug" in update && update.categorySlug && update.categorySlug !== slug) {
        router.push(`/kategori/${update.categorySlug}`)
        return
      }
      if ("categorySlug" in update && !update.categorySlug) {
        router.push("/urunler")
        return
      }
      const mapped: Record<string, string | undefined> = {}
      if ("minPrice" in update) mapped.minPrice = update.minPrice || undefined
      if ("maxPrice" in update) mapped.maxPrice = update.maxPrice || undefined
      if ("brandId" in update) mapped.brandId = update.brandId || undefined
      if ("inStock" in update) mapped.inStock = update.inStock ? "true" : undefined
      updateParams(mapped)
    },
    [updateParams, slug, router]
  )

  const handleClearFilters = useCallback(() => {
    router.push(basePath)
  }, [router, basePath])

  const handleSortChange = useCallback(
    (value: string) => {
      updateParams({ sort: value === "newest" ? undefined : value })
    },
    [updateParams]
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage > 1 ? String(newPage) : undefined })
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
    [updateParams]
  )

  // Fetch category info
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch("/api/categories")
        if (!res.ok) return
        const data = await res.json()
        // Find this category in the tree
        const allCats = data.categories as Array<CategoryInfo & { children: CategoryInfo[] }>
        for (const cat of allCats) {
          if (cat.slug === slug) {
            setCategoryInfo({ ...cat, parent: null })
            return
          }
          for (const child of cat.children || []) {
            if (child.slug === slug) {
              setCategoryInfo({
                ...child,
                children: [],
                parent: { id: cat.id, name: cat.name, slug: cat.slug },
              })
              return
            }
          }
        }
      } catch {
        // ignore
      }
    }
    fetchCategory()
  }, [slug])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const qp = new URLSearchParams()
        qp.set("page", String(page))
        qp.set("limit", "20")
        qp.set("categorySlug", slug)
        if (sort !== "newest") qp.set("sort", sort)
        if (search) qp.set("search", search)
        if (minPrice) qp.set("minPrice", minPrice)
        if (maxPrice) qp.set("maxPrice", maxPrice)
        if (brandId) qp.set("brandId", brandId)
        if (inStock) qp.set("inStock", "true")

        const res = await fetch(`/api/products?${qp.toString()}`)
        if (!res.ok) throw new Error("Fetch error")
        const data = await res.json()

        setProducts(data.products)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setFiltersData(data.filters)
      } catch {
        setProducts([])
        setTotal(0)
        setTotalPages(0)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [page, sort, search, slug, minPrice, maxPrice, brandId, inStock])

  // Build breadcrumb
  const breadcrumbItems = []
  if (categoryInfo?.parent) {
    breadcrumbItems.push({
      label: categoryInfo.parent.name,
      href: `/kategori/${categoryInfo.parent.slug}`,
    })
  }
  breadcrumbItems.push({ label: categoryInfo?.name || slug })

  const filterSidebar = (
    <ProductFilters
      categories={filtersData.categories}
      brands={filtersData.brands}
      priceRange={filtersData.priceRange}
      filters={filters}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
    />
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
        {categoryInfo?.name || "Kategori"}
      </h1>
      {categoryInfo?.description && (
        <p className="mt-1 text-sm text-muted-foreground">{categoryInfo.description}</p>
      )}

      {/* Subcategory cards */}
      {categoryInfo?.children && categoryInfo.children.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categoryInfo.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/kategori/${sub.slug}`}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-all hover:border-blue-200 hover:shadow-md"
            >
              {sub.image ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <Image
                    src={sub.image}
                    alt={sub.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                  <FolderOpen className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors">
                  {sub.name}
                </p>
                <p className="text-xs text-muted-foreground">{sub._count.products} urun</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          {filterSidebar}
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger
                  render={
                    <Button variant="outline" size="sm" className="lg:hidden" />
                  }
                >
                  <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                  Filtreler
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] overflow-y-auto p-4">
                  <SheetHeader>
                    <SheetTitle>Filtreler</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    {filterSidebar}
                  </div>
                </SheetContent>
              </Sheet>

              <span className="text-sm text-muted-foreground">
                {loading ? "Yukleniyor..." : `${total} urun bulundu`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <ProductSort value={sort} onChange={handleSortChange} />
              <div className="hidden items-center gap-1 sm:flex">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon-sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <ProductGridSkeleton viewMode={viewMode} />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageSearch className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h2 className="text-lg font-semibold text-foreground">Urun bulunamadi</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Bu kategoride henuz urun bulunmuyor.
              </p>
              <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                Filtreleri Temizle
              </Button>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "flex flex-col gap-3"
                }
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </div>

              <div className="mt-8">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={20}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductGridSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  const items = Array.from({ length: 8 })

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3">
        {items.map((_, i) => (
          <div key={i} className="flex animate-pulse gap-4 rounded-xl border p-4">
            <div className="h-32 w-32 rounded-lg bg-gray-200 sm:h-40 sm:w-40" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-20 rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
              <div className="mt-auto h-5 w-24 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-xl border">
          <div className="aspect-square bg-gray-200" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
            <div className="h-5 w-20 rounded bg-gray-200" />
            <div className="h-8 w-full rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}
