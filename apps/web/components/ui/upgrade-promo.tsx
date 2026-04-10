"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Sparkles, ArrowUpRight, X, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
    title: "Scale your outreach",
    body: "200 searches/mo, 1,000 results each, unlimited AI pitches, and priority scraping.",
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

interface ProfileState {
  plan: "free" | "pro" | "agency";
  role: "user" | "admin";
  plan_expires_at: string | null;
}

function daysRemaining(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function UpgradePromo({ collapsed = false }: UpgradePromoProps) {
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const dismissed = useSyncExternalStore(subscribeDismissed, getDismissed, getDismissedSSR);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("plan, role, plan_expires_at")
        .eq("id", user.id)
        .single();
      if (data && !cancelled) setProfile(data as ProfileState);
    }

    fetchProfile();

    // Re-fetch when the tab regains focus so changes made in other
    // tabs / by admins / by a completed checkout are reflected without
    // a hard refresh. Cheap — just one select on the profiles table.
    function onVisible() {
      if (document.visibilityState === "visible") fetchProfile();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Loading
  if (profile === null) return null;

  // ------- Beta membership badge (active beta / trial user) -------
  const betaDays = daysRemaining(profile.plan_expires_at);
  if (betaDays !== null && betaDays > 0) {
    if (collapsed) {
      return (
        <div
          className="flex items-center justify-center w-full p-2 rounded-lg bg-amber-500/10 text-amber-600"
          title={`Beta access — ${betaDays}d left`}
          aria-label={`Beta access ${betaDays} days remaining`}
        >
          <Crown className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-[var(--color-bg-tertiary)] p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">
            Beta access
          </span>
        </div>
        <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-1 leading-snug">
          Full access enabled
        </h4>
        <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug">
          {betaDays} day{betaDays === 1 ? "" : "s"} remaining on your beta membership.
        </p>
      </div>
    );
  }

  // ------- Admin badge (permanent unlimited) -------
  if (profile.role === "admin") {
    if (collapsed) {
      return (
        <div
          className="flex items-center justify-center w-full p-2 rounded-lg bg-red-500/10 text-red-600"
          title="Admin access"
          aria-label="Admin access"
        >
          <Crown className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-[var(--color-bg-tertiary)] p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Crown className="w-3.5 h-3.5 text-red-600" />
          <span className="text-[10px] uppercase tracking-wider text-red-600 font-bold">
            Admin
          </span>
        </div>
        <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug">
          Unlimited access to everything.
        </p>
      </div>
    );
  }

  // ------- Standard upgrade promo (free or pro, not dismissed) -------
  if (profile.plan === "agency" || dismissed) return null;

  const promo = PROMOS[profile.plan];
  // Free users upgrade to Pro, Pro users upgrade to Agency
  const targetPlan: "pro" | "agency" = profile.plan === "free" ? "pro" : "agency";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => startUpgrade(targetPlan, setUpgradeLoading)}
        disabled={upgradeLoading}
        className="flex items-center justify-center w-full p-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors disabled:opacity-50"
        title={promo.cta}
        aria-label={promo.cta}
      >
        {upgradeLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </button>
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
      <button
        type="button"
        onClick={() => startUpgrade(targetPlan, setUpgradeLoading)}
        disabled={upgradeLoading}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-accent)] hover:underline disabled:opacity-50"
      >
        {upgradeLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : null}
        {promo.cta} <ArrowUpRight className="w-3 h-3" />
      </button>
    </div>
  );
}

async function startUpgrade(
  plan: "pro" | "agency",
  setLoading: (v: boolean) => void
) {
  setLoading(true);
  try {
    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to start checkout");
      return;
    }
    if (data.url) window.location.href = data.url;
  } catch {
    toast.error("Failed to start checkout");
  } finally {
    setLoading(false);
  }
}
