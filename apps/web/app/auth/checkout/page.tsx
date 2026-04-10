"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Handoff page after auth callback. Reads ?plan=pro|agency from the URL,
 * POSTs to /api/billing/subscribe, and redirects the browser to Stripe
 * checkout.
 *
 * Used when a logged-out user clicks "Go Pro" or "Go Agency" on the
 * marketing pricing page — the plan is threaded through the magic-link
 * flow via the `next` param on the auth callback, which lands here once
 * the session is established.
 *
 * Intentionally NOT in the (app) route group — no sidebar, no app chrome,
 * just a centered spinner while we redirect to Stripe.
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plan !== "pro" && plan !== "agency") {
      router.replace("/dashboard");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/billing/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to start checkout");
          return;
        }
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError("No checkout URL returned");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start checkout");
      }
    })();
  }, [plan, router]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
      {error ? (
        <>
          <p className="text-sm text-red-600 font-medium">Couldn&apos;t start checkout</p>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-md">{error}</p>
          <button
            onClick={() => router.push("/settings#billing")}
            className="mt-2 text-sm text-[var(--color-accent)] hover:underline"
          >
            Go to Billing settings
          </button>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            Starting your {plan === "pro" ? "Pro" : "Agency"} checkout&hellip;
          </p>
        </>
      )}
    </div>
  );
}
