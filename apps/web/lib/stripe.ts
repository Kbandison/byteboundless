import Stripe from "stripe";

/**
 * Shared Stripe client. Instantiated lazily so routes that don't touch
 * Stripe don't pay the import cost, and so missing env vars fail loudly
 * in the routes that do use it (instead of crashing at module load).
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  _stripe = new Stripe(key, {
    // Pin the API version so Stripe schema changes don't break us
    // silently — future upgrades are intentional via this string.
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });
  return _stripe;
}

/**
 * Map our internal plan names to Stripe price IDs. Set these in your
 * environment after creating recurring prices in the Stripe dashboard
 * for the Pro ($29/mo) and Agency ($79/mo) products.
 */
export const PLAN_PRICE_IDS: Record<"pro" | "agency", string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  agency: process.env.STRIPE_AGENCY_PRICE_ID,
};

/**
 * Given a Stripe subscription, figure out which of our plans it maps to.
 * Returns null if the subscription uses a price we don't recognize
 * (shouldn't happen in practice — defensive).
 */
export function planFromSubscription(
  subscription: Stripe.Subscription
): "pro" | "agency" | null {
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) return null;
  if (priceId === PLAN_PRICE_IDS.pro) return "pro";
  if (priceId === PLAN_PRICE_IDS.agency) return "agency";
  return null;
}
