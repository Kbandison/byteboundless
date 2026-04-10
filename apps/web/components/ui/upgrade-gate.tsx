"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * In-app feature lock. Shown inside authed routes when a free user
 * hits a pro-only feature (saved lists, CSV export, etc.). Since the
 * caller is always a logged-in user, clicking "Upgrade" kicks off the
 * Stripe checkout flow directly — no detour through the marketing
 * pricing page.
 */
export function UpgradeGate({
  feature,
  className,
  inline = false,
}: {
  feature: string;
  className?: string;
  inline?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
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

  if (inline) {
    return (
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline font-medium disabled:opacity-50",
          className
        )}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
        Pro feature
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-6 px-4 text-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50",
        className
      )}
    >
      <Lock className="w-5 h-5 text-[var(--color-text-dim)] mb-2" />
      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
        {feature}
      </p>
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">
        Upgrade to Pro to unlock this feature.
      </p>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] font-medium hover:underline disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Upgrade to Pro &rarr;
      </button>
    </div>
  );
}
