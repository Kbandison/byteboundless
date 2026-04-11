"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { ArrowLeft, ArrowRight, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getStripeClient } from "@/lib/stripe-client";
import { CheckoutForm } from "./checkout-form";
import { OrderSummary, type Plan, type CheckoutType } from "./order-summary";

interface UpgradePreview {
  fromPlan: Plan;
  toPlan: Plan;
  subscriptionId: string;
  prorationAmountCents: number;
  prorationCurrency: string | null;
  isCredit: boolean;
}

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
  const [upgradePreview, setUpgradePreview] = useState<UpgradePreview | null>(null);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Strict-Mode guard. React mounts → unmounts → remounts every effect
  // in dev to surface missing cleanup. Without this ref, the fetch
  // below fires twice and each fire creates its own Stripe subscription
  // on the server — which is a real bug (duplicate subs, race between
  // two clientSecrets, Payment Element remount crashes) and NOT just a
  // dev quirk. The server side was also made idempotent for defense in
  // depth; this ref is the first line of defense.
  //
  // The key is (type, plan) so the effect still re-fires if the user
  // changes the plan in-place (they can't today, but keeping it correct
  // costs nothing).
  const fetchedKeyRef = useRef<string | null>(null);

  // This effect bootstraps the checkout: validates input and POSTs
  // to create a Stripe payment session.
  useEffect(() => {
    const key = `${type}:${plan ?? ""}`;
    if (fetchedKeyRef.current === key) return;
    fetchedKeyRef.current = key;

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

        if (!res.ok) {
          // "Already on this plan" is not an error the user needs to
          // see — it just means they landed on /checkout for a plan
          // they already have. Bounce them to settings where card /
          // cancel / plan change lives.
          if (
            typeof data.error === "string" &&
            /already on this plan/i.test(data.error)
          ) {
            router.replace("/settings#billing");
            return;
          }
          setError(data.error || "Failed to start checkout");
          setLoading(false);
          return;
        }

        // Legacy portal redirect path — kept for safety but the
        // subscribe API no longer returns portalUrl after the native
        // subscription management migration.
        if (data.portalUrl) {
          window.location.href = data.portalUrl;
          return;
        }

        // Pro↔Agency plan change → render the upgrade confirmation
        // card. No Payment Element needed since the user's card is
        // already on file; Stripe will bill proration on the next
        // invoice when they confirm.
        if (data.upgrade) {
          setUpgradePreview(data.upgrade as UpgradePreview);
          setLoading(false);
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
        const message = err instanceof Error ? err.message : "Failed to load checkout";
        setError(message);
        setLoading(false);
      }
    })();
    // router is stable across renders (useRouter returns a memoized
    // instance) so omitting it from deps is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, plan]);

  async function handleConfirmUpgrade() {
    if (!upgradePreview) return;
    setUpgradeSubmitting(true);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: upgradePreview.toPlan, confirmUpgrade: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.upgraded) {
        toast.error(data.error || "Couldn't update your plan");
        setUpgradeSubmitting(false);
        return;
      }
      toast.success(
        `Upgraded to ${upgradePreview.toPlan === "agency" ? "Agency" : "Pro"}`
      );
      // router.replace (not push) so hitting Back from /settings skips
      // past the /checkout entry entirely — otherwise the stale
      // confirmation card would re-render with an "already on this
      // plan" state. router.refresh forces server components to
      // re-fetch so the settings page shows the new plan immediately.
      router.replace(
        `/settings?subscribe=plan-updated&plan=${upgradePreview.toPlan}#billing`
      );
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upgrade failed";
      toast.error(message);
      setUpgradeSubmitting(false);
    }
  }

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
          {upgradePreview ? "Change plan" : "Checkout"}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          {upgradePreview
            ? `${upgradePreview.fromPlan === "agency" ? "Agency" : "Pro"} → ${upgradePreview.toPlan === "agency" ? "Agency" : "Pro"}`
            : type === "subscription"
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
            <div className="p-6 rounded-xl border border-red-500/40 bg-red-500/5">
              <p className="text-sm font-semibold text-red-600 mb-1">
                Couldn&apos;t start checkout
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                {error}
              </p>
              <button
                onClick={() => router.push("/settings#billing")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                Back to billing settings
              </button>
            </div>
          )}

          {upgradePreview && !loading && !error && (
            <UpgradeConfirmCard
              preview={upgradePreview}
              submitting={upgradeSubmitting}
              onConfirm={handleConfirmUpgrade}
              onCancel={() => router.push("/settings#billing")}
            />
          )}

          {clientSecret && !loading && !error && !upgradePreview ? (
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
          <OrderSummary
            type={type}
            plan={upgradePreview ? upgradePreview.toPlan : plan}
            upgrade={upgradePreview}
          />
        </div>
      </div>
    </div>
  );
}

function formatCurrency(cents: number, currency: string | null): string {
  const code = (currency || "usd").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function UpgradeConfirmCard({
  preview,
  submitting,
  onConfirm,
  onCancel,
}: {
  preview: UpgradePreview;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const fromLabel = preview.fromPlan === "agency" ? "Agency" : "Pro";
  const toLabel = preview.toPlan === "agency" ? "Agency" : "Pro";
  const isUpgrade =
    preview.fromPlan === "pro" && preview.toPlan === "agency";
  const hasCharge = preview.prorationAmountCents > 0;
  const amountLabel = formatCurrency(
    preview.prorationAmountCents,
    preview.prorationCurrency
  );

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
          {isUpgrade ? "Confirm upgrade" : "Confirm plan change"}
        </h2>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] mb-6">
        You&apos;re already subscribed — we just need to swap the plan on
        your existing subscription. No new payment details needed.
      </p>

      <div className="flex items-center gap-3 mb-6 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] mb-1">
            Current
          </p>
          <p className="font-[family-name:var(--font-display)] text-base font-semibold">
            {fromLabel}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] mb-1">
            New
          </p>
          <p className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-accent)]">
            {toLabel}
          </p>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium">
            {hasCharge ? "Charged today" : preview.isCredit ? "Credit applied" : "Due today"}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-2xl font-bold">
            {amountLabel}
          </span>
        </div>
        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
          {hasCharge
            ? `Prorated difference between ${fromLabel} and ${toLabel} for the remainder of your current billing cycle. Charged to your saved payment method right now. Your next invoice will be the full ${toLabel} rate on your normal billing date.`
            : preview.isCredit
              ? `Downgrading leaves a balance credit on your account. It applies automatically to your next ${toLabel} invoice — no charge today.`
              : `Nothing is due today. Your next invoice will be at the ${toLabel} rate.`}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 border border-[var(--color-border)] text-sm font-medium px-5 py-3 rounded-lg hover:border-[var(--color-border-hover)] disabled:opacity-50 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white text-sm font-semibold px-5 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating&hellip;
            </>
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4" />
              {hasCharge
                ? `Pay ${amountLabel} & upgrade`
                : isUpgrade
                  ? `Upgrade to ${toLabel}`
                  : `Switch to ${toLabel}`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
