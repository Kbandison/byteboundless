"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpgradeGate({
  feature,
  className,
  inline = false,
}: {
  feature: string;
  className?: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <Link
        href="/pricing"
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline font-medium",
          className
        )}
      >
        <Lock className="w-3 h-3" />
        Pro feature
      </Link>
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
      <Link
        href="/pricing"
        className="text-xs text-[var(--color-accent)] font-medium hover:underline"
      >
        View plans &rarr;
      </Link>
    </div>
  );
}
