"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, MapPin, Plus, Pencil, Trash2, X, Check } from "lucide-react"

interface City {
  id: number
  name: string
}

interface District {
  id: number
  name: string
}

interface Address {
  id: string
  title: string
  cityId: number
  districtId: number
  fullAddress: string
  isDefault: boolean
  city: { id: number; name: string }
  district: { id: number; name: string }
}

interface AddressFormData {
  title: string
  cityId: string
  districtId: string
  fullAddress: string
  isDefault: boolean
}

const emptyForm: AddressFormData = {
  title: "",
  cityId: "",
  districtId: "",
  fullAddress: "",
  isDefault: false,
}

export default function AdreslerimPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])

  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AddressFormData>(emptyForm)
  const [formDistricts, setFormDistricts] = useState<District[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch addresses
  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/addresses")
      if (res.ok) {
        const data = await res.json()
        setAddresses(data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Fetch cities once
  useEffect(() => {
    fetchAddresses()
    fetch("/api/cities")
      .then((r) => r.json())
      .then(setCities)
      .catch(() => {})
  }, [])

  // Fetch districts when city changes in form
  useEffect(() => {
    if (!formData.cityId) {
      setFormDistricts([])
      setFormData((prev) => ({ ...prev, districtId: "" }))
      return
    }
    fetch(`/api/cities/${formData.cityId}/districts`)
      .then((r) => r.json())
      .then((data) => {
        setFormDistricts(data)
        setFormData((prev) => ({ ...prev, districtId: "" }))
      })
      .catch(() => setFormDistricts([]))
  }, [formData.cityId])

  const openAddForm = () => {
    setFormData(emptyForm)
    setFormDistricts([])
    setEditingId(null)
    setError(null)
    setShowAddForm(true)
  }

  const openEditForm = async (address: Address) => {
    setError(null)
    setEditingId(address.id)
    setShowAddForm(false)

    // Pre-load districts for the city
    let loadedDistricts: District[] = []
    try {
      const res = await fetch(`/api/cities/${address.cityId}/districts`)
      loadedDistricts = await res.json()
    } catch {
      // ignore
    }
    setFormDistricts(loadedDistricts)
    setFormData({
      title: address.title,
      cityId: String(address.cityId),
      districtId: String(address.districtId),
      fullAddress: address.fullAddress,
      isDefault: address.isDefault,
    })
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingId(null)
    setFormData(emptyForm)
    setFormDistricts([])
    setError(null)
  }

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value
    setFormData((prev) => ({ ...prev, [target.name]: value }))
  }

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!formData.title || !formData.cityId || !formData.districtId || !formData.fullAddress) {
      setError("Lütfen tüm alanları doldurun.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          cityId: formData.cityId,
          districtId: formData.districtId,
          fullAddress: formData.fullAddress,
          isDefault: formData.isDefault,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Bir hata oluştu.")
        return
      }
      await fetchAddresses()
      cancelForm()
    } catch {
      setError("Bir hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setError(null)
    if (!formData.title || !formData.cityId || !formData.districtId || !formData.fullAddress) {
      setError("Lütfen tüm alanları doldurun.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/user/addresses/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          cityId: formData.cityId,
          districtId: formData.districtId,
          fullAddress: formData.fullAddress,
          isDefault: formData.isDefault,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Bir hata oluştu.")
        return
      }
      await fetchAddresses()
      cancelForm()
    } catch {
      setError("Bir hata oluştu.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" })
      if (res.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== id))
        if (editingId === id) cancelForm()
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  const AddressForm = ({
    onSubmit,
    submitLabel,
  }: {
    onSubmit: (e: React.FormEvent) => void
    submitLabel: string
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Başlık */}
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Başlık <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleFormChange}
          placeholder='Örn. "Ev", "İş"'
          className="w-full rounded-xl border border-[#E7E0D8] bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* İl */}
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          İl <span className="text-red-500">*</span>
        </label>
        <select
          name="cityId"
          value={formData.cityId}
          onChange={handleFormChange}
          className="w-full rounded-xl border border-[#E7E0D8] bg-stone-50 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        >
          <option value="">İl seçin</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      {/* İlçe */}
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          İlçe <span className="text-red-500">*</span>
        </label>
        <select
          name="districtId"
          value={formData.districtId}
          onChange={handleFormChange}
          disabled={!formData.cityId || formDistricts.length === 0}
          className="w-full rounded-xl border border-[#E7E0D8] bg-stone-50 px-4 py-2.5 text-sm text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
        >
          <option value="">
            {formData.cityId ? "İlçe seçin" : "Önce il seçin"}
          </option>
          {formDistricts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Açık Adres */}
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Açık Adres <span className="text-red-500">*</span>
        </label>
        <textarea
          name="fullAddress"
          value={formData.fullAddress}
          onChange={handleFormChange}
          rows={3}
          placeholder="Mahalle, sokak, bina no, daire no..."
          className="w-full resize-none rounded-xl border border-[#E7E0D8] bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* Varsayılan */}
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleFormChange}
          className="size-4 rounded accent-amber-700"
        />
        <span className="text-sm text-stone-700">Varsayılan adres olarak ayarla</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
        >
          <Check className="size-4" />
          {submitting ? "Kaydediliyor..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={cancelForm}
          className="inline-flex items-center gap-2 rounded-xl border border-[#E7E0D8] bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
        >
          <X className="size-4" />
          İptal
        </button>
      </div>
    </form>
  )

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/hesabim"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-amber-700"
        >
          <ChevronLeft className="size-4" />
          Hesabım
        </Link>
        <span className="text-stone-300">/</span>
        <h1
          className="text-2xl font-bold text-stone-900"
          style={{ fontFamily: "var(--font-heading), serif" }}
        >
          Adreslerim
        </h1>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="size-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-700" />
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="space-y-4">
          {/* Address list */}
          {addresses.length === 0 && !showAddForm && (
            <div className="rounded-2xl border border-[#E7E0D8] bg-white p-10 text-center">
              <MapPin className="mx-auto mb-3 size-10 text-stone-300" />
              <p className="text-stone-500">Henüz kayıtlı adresiniz yok.</p>
            </div>
          )}

          {addresses.map((address) => (
            <div key={address.id}>
              {/* Address card */}
              <div className="rounded-2xl border border-[#E7E0D8] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      {address.title}
                    </span>
                    {address.isDefault && (
                      <span className="rounded-lg bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                        Varsayılan
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() =>
                        editingId === address.id ? cancelForm() : openEditForm(address)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E0D8] bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
                    >
                      <Pencil className="size-3.5" />
                      {editingId === address.id ? "İptal" : "Düzenle"}
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      disabled={deletingId === address.id}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                    >
                      <Trash2 className="size-3.5" />
                      {deletingId === address.id ? "Siliniyor..." : "Sil"}
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-stone-800">
                    {address.city.name} / {address.district.name}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">{address.fullAddress}</p>
                </div>
              </div>

              {/* Inline edit form for this address */}
              {editingId === address.id && (
                <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
                  <p className="mb-4 text-sm font-semibold text-stone-700">Adresi Düzenle</p>
                  <AddressForm onSubmit={handleSubmitEdit} submitLabel="Kaydet" />
                </div>
              )}
            </div>
          ))}

          {/* Add new address button / form */}
          {!showAddForm && editingId === null && (
            <button
              onClick={openAddForm}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 py-4 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
            >
              <Plus className="size-4" />
              Yeni Adres Ekle
            </button>
          )}

          {showAddForm && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
              <p className="mb-4 text-sm font-semibold text-stone-700">Yeni Adres Ekle</p>
              <AddressForm onSubmit={handleSubmitAdd} submitLabel="Ekle" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
