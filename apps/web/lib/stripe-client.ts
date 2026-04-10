"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Browser-side Stripe singleton. Loaded lazily on first use so the
 * stripe.js script (~80KB) doesn't block initial page load — only
 * the /checkout page actually needs it.
 *
 * Uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY which is exposed to the
 * browser. The publishable key is safe to ship in client bundles
 * (it can only initiate payments, not capture them).
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
