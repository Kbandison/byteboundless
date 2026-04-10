"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Handoff page after auth callback. Reads ?plan=pro|agency from the URL
 * and redirects to /checkout?type=subscription&plan=X where the actual
 * Payment Element form lives.
 *
 * Used when a logged-out user clicks "Go Pro" or "Go Agency" on the
 * marketing pricing page — the plan is threaded through the magic-link
 * flow via the `next` param on the auth callback, which lands here once
 * the session is established. We then bounce them straight into our
 * custom checkout page.
 *
 * Intentionally NOT in the (app) route group — no sidebar, no app chrome,
 * just a centered spinner during the brief redirect.
 */
export default function CheckoutHandoffPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <HandoffInner />
    </Suspense>
  );
}

function Fallback() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      <p className="text-sm text-[var(--color-text-secondary)]">Loading&hellip;</p>
    </div>
  );
}

function HandoffInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan");

  useEffect(() => {
    if (plan === "pro" || plan === "agency") {
      router.replace(`/checkout?type=subscription&plan=${plan}`);
    } else {
      router.replace("/dashboard");
    }
  }, [plan, router]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      <p className="text-sm text-[var(--color-text-secondary)]">
        {plan === "pro" || plan === "agency"
          ? `Loading your ${plan === "pro" ? "Pro" : "Agency"} checkout…`
          : "Redirecting…"}
      </p>
    </div>
  );
}
