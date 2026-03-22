// Cart utility functions for client-side use

export interface CartItem {
  id: string
  productId: string
  variationId: string | null
  quantity: number
  unitPriceUsd: number
  unitPriceTl: number
  lineTotalUsd: number
  lineTotalTl: number
  product: {
    id: string
    name: string
    slug: string
    image: string | null
    stockQty: number
    status: string
  }
  variation: {
    id: string
    combination: Record<string, string>
    stock: number
    imageUrl: string | null
  } | null
}

export interface CartData {
  items: CartItem[]
  totalUsd: number
  totalTl: number
}

export async function fetchCart(): Promise<CartData> {
  const res = await fetch("/api/cart")
  if (!res.ok) throw new Error("Sepet yüklenemedi")
  return res.json()
}

export async function addToCart(productId: string, variationId?: string | null, quantity = 1) {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, variationId, quantity }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "Sepete eklenemedi")
  }
  return res.json()
}

export async function updateCartItem(itemId: string, quantity: number) {
  const res = await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, quantity }),
  })
  if (!res.ok) throw new Error("Güncelleme başarısız")
  return res.json()
}

export async function removeCartItem(itemId: string) {
  const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Silme başarısız")
  return res.json()
}

export async function clearCart() {
  const res = await fetch("/api/cart?clearAll=true", { method: "DELETE" })
  if (!res.ok) throw new Error("Sepet temizlenemedi")
  return res.json()
}

export function formatPrice(amount: number, currency: "USD" | "TL" = "USD"): string {
  if (currency === "TL") {
    return `${amount.toFixed(2)} ₺`
  }
  return `$${amount.toFixed(2)}`
}

export function buildWhatsAppMessage(
  items: CartItem[],
  totalUsd: number,
  totalTl: number,
  address?: string,
  orderNote?: string,
  orderNo?: string,
  coupon?: { code: string; discount: number },
): string {
  let msg = `🛒 *Yeni Sipariş*${orderNo ? ` - ${orderNo}` : ""}\n\n`
  msg += `📦 *Ürünler:*\n`

  items.forEach((item, i) => {
    const variationStr = item.variation
      ? ` (${Object.values(item.variation.combination).join(", ")})`
      : ""
    msg += `${i + 1}. ${item.product.name}${variationStr}\n`
    msg += `   ${item.quantity} adet x $${item.unitPriceUsd.toFixed(2)} = $${item.lineTotalUsd.toFixed(2)}\n`
  })

  if (coupon) {
    msg += `\n🎟️ *Kupon:* ${coupon.code} (-${coupon.discount.toFixed(2)} ₺)\n`
  }

  msg += `\n💰 *Toplam:* $${totalUsd.toFixed(2)} / ${totalTl.toFixed(2)} ₺\n`

  if (address) {
    msg += `\n📍 *Adres:* ${address}\n`
  }

  if (orderNote) {
    msg += `\n📝 *Not:* ${orderNote}\n`
  }

  return msg
}
