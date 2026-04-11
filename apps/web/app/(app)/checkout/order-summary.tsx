"use client";

import { Check } from "lucide-react";

export type Plan = "pro" | "agency";
export type CheckoutType = "subscription" | "overage";

export interface UpgradeSummaryInfo {
  fromPlan: Plan;
  toPlan: Plan;
  prorationAmountCents: number;
  prorationCurrency: string | null;
  isCredit: boolean;
}

interface OrderSummaryProps {
  type: CheckoutType;
  plan: Plan | null;
  upgrade?: UpgradeSummaryInfo | null;
}

const PLAN_DETAILS: Record<Plan, {
  name: string;
  priceCents: number;
  period: string;
  features: string[];
}> = {
  pro: {
    name: "Pro",
    priceCents: 2900,
    period: "/month",
    features: [
      "50 searches per month",
      "500 results per search",
      "200 AI pitches per month",
      "Saved lists + outcome tracking",
      "CSV export",
      "Lighthouse audits",
    ],
  },
  agency: {
    name: "Agency",
    priceCents: 7900,
    period: "/month",
    features: [
      "200 searches per month",
      "1,000 results per search",
      "Unlimited AI pitches",
      "Priority scraping",
      "Priority support",
      "Everything in Pro",
    ],
  },
};

const OVERAGE_DETAILS = {
  name: "200 Extra Search Results",
  priceCents: 400,
  period: "one-time",
  features: [
    "200 additional results added to your account",
    "Doesn't expire with your monthly reset",
    "Applies to your next searches automatically",
  ],
};

function formatPriceWhole(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatPriceExact(cents: number, currency: string | null): string {
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

export function OrderSummary({ type, plan, upgrade }: OrderSummaryProps) {
  // Plan-change flow: the target plan's feature list stays useful, but
  // the totals section needs to reflect the proration — not the full
  // new-subscription price.
  const details =
    type === "subscription" && plan ? PLAN_DETAILS[plan] : OVERAGE_DETAILS;

  const isUpgradeFlow = Boolean(upgrade);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-6 sticky top-24">
      <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">
        {isUpgradeFlow ? "New plan" : "Order summary"}
      </p>

      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight mb-1">
        {details.name}
      </h2>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="font-[family-name:var(--font-mono)] text-3xl font-bold">
          {formatPriceWhole(details.priceCents)}
        </span>
        <span className="text-sm text-[var(--color-text-dim)]">{details.period}</span>
      </div>

      <div className="space-y-2.5 mb-6">
        {details.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
            <span className="text-sm text-[var(--color-text-secondary)] leading-snug">
              {feature}
            </span>
          </div>
        ))}
      </div>

      {isUpgradeFlow && upgrade ? (
        <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">
              New monthly rate
            </span>
            <span className="font-[family-name:var(--font-mono)]">
              {formatPriceWhole(details.priceCents)}/mo
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">
              Prorated adjustment
            </span>
            <span className="font-[family-name:var(--font-mono)]">
              {formatPriceExact(upgrade.prorationAmountCents, upgrade.prorationCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-[var(--color-border)]">
            <span>
              {upgrade.isCredit ? "Credit applied" : "Total today"}
            </span>
            <span className="font-[family-name:var(--font-mono)]">
              {formatPriceExact(upgrade.prorationAmountCents, upgrade.prorationCurrency)}
            </span>
          </div>
        </div>
      ) : (
        <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">Subtotal</span>
            <span className="font-[family-name:var(--font-mono)]">
              {formatPriceWhole(details.priceCents)}
            </span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-[var(--color-border)]">
            <span>Total today</span>
            <span className="font-[family-name:var(--font-mono)]">
              {formatPriceWhole(details.priceCents)}
            </span>
          </div>
        </div>
      )}

      {isUpgradeFlow ? (
        <p className="text-[11px] text-[var(--color-text-dim)] mt-4 leading-snug">
          Plan change bills immediately for the prorated difference. Your
          next invoice is the full new rate on your normal billing date.
        </p>
      ) : type === "subscription" ? (
        <p className="text-[11px] text-[var(--color-text-dim)] mt-4 leading-snug">
          Recurring billing. Cancel anytime from Settings → Billing. Quotas reset on a rolling 30-day cycle.
        </p>
      ) : (
        <p className="text-[11px] text-[var(--color-text-dim)] mt-4 leading-snug">
          One-time charge. Credits added to your account immediately on payment.
        </p>
      )}
    </div>
  );
}
