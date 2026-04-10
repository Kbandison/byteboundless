"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * In-app feature lock. Shown inside authed routes when a free user
 * hits a pro-only feature (saved lists, CSV export, etc.). Clicking
 * "Upgrade" navigates to our custom /checkout page where the Stripe
 * Payment Element is rendered.
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
  const router = useRouter();

  function startCheckout() {
    router.push("/checkout?type=subscription&plan=pro");
  }

  if (inline) {
    return (
      <button
        type="button"
        onClick={startCheckout}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline font-medium",
          className
        )}
      >
        <Lock className="w-3 h-3" />
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
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] font-medium hover:underline"
      >
        Upgrade to Pro &rarr;
      </button>
    </div>
  );
}
