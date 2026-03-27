import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
    })
  }
  return _stripe
}

// For backwards compatibility - lazy getter
export const stripe = {
  get checkout() { return getStripe().checkout },
  get coupons() { return getStripe().coupons },
  get webhooks() { return getStripe().webhooks },
  get balance() { return getStripe().balance },
} as unknown as Stripe
