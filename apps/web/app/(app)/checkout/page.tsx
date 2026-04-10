"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getStripeClient } from "@/lib/stripe-client";
import { CheckoutForm } from "./checkout-form";
import { OrderSummary, type Plan, type CheckoutType } from "./order-summary";

// Hoisted outside the component so Stripe Elements doesn't re-init on
// every render (Elements only re-mounts when `options` reference changes).
const STRIPE_APPEARANCE: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#0066FF",
    colorBackground: "#FFFFFF",
    colorText: "#1A1A1A",
    colorDanger: "#dc2626",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: "8px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #E5E5E5",
      boxShadow: "none",
      padding: "10px 12px",
    },
    ".Input:focus": {
      border: "1px solid #0066FF",
      boxShadow: "0 0 0 3px rgba(0, 102, 255, 0.1)",
    },
    ".Label": {
      fontSize: "13px",
      fontWeight: "500",
      color: "#1A1A1A",
    },
  },
};

/**
 * Custom checkout page. Replaces Stripe-hosted Checkout.
 *
 * Renders an order summary on the left and the Stripe Payment Element
 * on the right. The Payment Element is a Stripe-iframed component for
 * card / Apple Pay / Google Pay input — keeps us PCI-compliant while
 * letting us own the layout, branding, and copy.
 *
 * Query params:
 *   ?type=subscription&plan=pro|agency  → subscribe flow
 *   ?type=overage                       → 200 extra results, $4
 */
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutFallback() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12 flex justify-center">
      <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
    </div>
  );
}

function CheckoutInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const type = (searchParams.get("type") || "subscription") as CheckoutType;
  const plan = searchParams.get("plan") as Plan | null;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* This effect bootstraps the checkout: validates input and POSTs to
     create a Stripe payment session. setState calls happen inside the
     async IIFE after an await, so they're not "synchronously within an
     effect" — but the lint rule can't see through the function call. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;

    if (type === "subscription" && plan !== "pro" && plan !== "agency") {
      setError("Invalid plan");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const endpoint =
          type === "subscription" ? "/api/billing/subscribe" : "/api/billing/checkout";
        const body = type === "subscription" ? { plan } : {};

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || "Failed to start checkout");
          setLoading(false);
          return;
        }

        // Existing-subscription users get a Billing Portal URL back
        // instead of a clientSecret. Bounce them straight to it.
        if (data.portalUrl) {
          window.location.href = data.portalUrl;
          return;
        }

        if (!data.clientSecret) {
          setError("No payment session returned");
          setLoading(false);
          return;
        }

        setClientSecret(data.clientSecret);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load checkout";
        setError(message);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [type, plan]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-2">
          Checkout
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          {type === "subscription"
            ? `Upgrade to ${plan === "agency" ? "Agency" : "Pro"}`
            : "Buy Extra Results"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Payment form */}
        <div className="order-2 lg:order-1">
          {loading && (
            <div className="p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] flex flex-col items-center gap-4">
              <Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                Preparing secure payment&hellip;
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="p-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                Couldn&apos;t start checkout
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mb-4">{error}</p>
              <button
                onClick={() => router.push("/settings#billing")}
                className="text-xs text-red-700 dark:text-red-400 underline"
              >
                Back to billing settings
              </button>
            </div>
          )}

          {clientSecret && !loading && !error ? (
            <Elements
              stripe={getStripeClient()}
              options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
            >
              <CheckoutForm
                type={type}
                plan={plan}
                onError={(msg) => toast.error(msg)}
              />
            </Elements>
          ) : null}
        </div>

        {/* Order summary */}
        <div className="order-1 lg:order-2">
          <OrderSummary type={type} plan={plan} />
        </div>
      </div>
    </div>
  );
}
