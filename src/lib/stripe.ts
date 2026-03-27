import Stripe from "stripe"

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  })
}

// Lazy initialization - only creates client when actually used
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    const client = getStripeClient()
    return (client as Record<string | symbol, unknown>)[prop]
  },
})
