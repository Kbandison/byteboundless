"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Sparkles, ArrowUpRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PromoConfig {
  badge: string;
  title: string;
  body: string;
  cta: string;
}

const PROMOS: Record<"free" | "pro", PromoConfig> = {
  free: {
    badge: "Pro",
    title: "Unlock the full pipeline",
    body: "Saved lists, CSV export, Lighthouse audits, and 50 searches/mo for $29.",
    cta: "Upgrade to Pro",
  },
  pro: {
    badge: "Agency",
    title: "Scale with your team",
    body: "5 seats, 200 searches/mo, unlimited AI pitches, and priority scraping.",
    cta: "Upgrade to Agency",
  },
};

const DISMISS_KEY = "bb-upgrade-promo-dismissed";

function subscribeDismissed(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("storage", handler);
  window.addEventListener("bb-upgrade-promo-dismissed", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("bb-upgrade-promo-dismissed", handler);
  };
}
function getDismissed() {
  return localStorage.getItem(DISMISS_KEY) === "1";
}
function getDismissedSSR() {
  return false;
}

interface UpgradePromoProps {
  collapsed?: boolean;
}

export function UpgradePromo({ collapsed = false }: UpgradePromoProps) {
  const [plan, setPlan] = useState<"free" | "pro" | "agency" | null>(null);
  const dismissed = useSyncExternalStore(subscribeDismissed, getDismissed, getDismissedSSR);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      const p = (data as { plan: "free" | "pro" | "agency" } | null)?.plan;
      if (p) setPlan(p);
    })();
  }, []);

  // Hide entirely for agency users (top tier) or while loading
  if (plan === "agency" || plan === null || dismissed) return null;

  const promo = PROMOS[plan];

  // Collapsed sidebar variant: just an icon button
  if (collapsed) {
    return (
      <Link
        href="/pricing"
        className="flex items-center justify-center w-full p-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
        title={promo.cta}
        aria-label={promo.cta}
      >
        <Sparkles className="w-4 h-4" />
      </Link>
    );
  }

  return (
    <div className="relative rounded-xl border border-[var(--color-accent)]/20 bg-gradient-to-br from-[var(--color-accent-2)] to-[var(--color-bg-tertiary)] p-3 overflow-hidden">
      <button
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          window.dispatchEvent(new Event("bb-upgrade-promo-dismissed"));
        }}
        className="absolute top-1.5 right-1.5 p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
        aria-label="Dismiss upgrade promo"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold">
          {promo.badge}
        </span>
      </div>
      <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-1 leading-snug">
        {promo.title}
      </h4>
      <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug mb-2.5 pr-3">
        {promo.body}
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-accent)] hover:underline"
      >
        {promo.cta} <ArrowUpRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
