"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import {
  CreditCard,
  Loader2,
  XCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getStripeClient } from "@/lib/stripe-client";

// Hoisted outside the component so Elements doesn't re-init on every
// render — the options reference has to be stable.
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

interface BillingStatus {
  plan: string;
  hasSubscription: boolean;
  subscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  paymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
}

function formatBrand(brand: string): string {
  const map: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return map[brand.toLowerCase()] ?? brand;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SubscriptionManagement() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [showUpdatePm, setShowUpdatePm] = useState(false);
  const [pmClientSecret, setPmClientSecret] = useState<string | null>(null);
  const [pmLoading, setPmLoading] = useState(false);

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [resubLoading, setResubLoading] = useState(false);

  const refetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      const data = await res.json();
      if (res.ok) setStatus(data as BillingStatus);
    } catch {
      // Swallow — the UI stays in its previous state.
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refetchStatus();
      setLoading(false);
    })();
  }, [refetchStatus]);

  // 3DS return handler. When a payment method update triggers 3DS,
  // Stripe redirects the browser to /settings?setup_intent=si_xxx
  // &setup_intent_client_secret=...&redirect_status=succeeded. The
  // inline Payment Element submit handler isn't in the DOM anymore
  // by the time we land here, so we have to finish the flow from
  // scratch: retrieve the SetupIntent client-side, pull the PM id
  // off it, and call /api/billing/payment-method/confirm ourselves.
  //
  // Without this effect the new card ends up attached to the customer
  // but never set as default — the user would think the update
  // worked but their next bill would still charge the old card.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientSecret = params.get("setup_intent_client_secret");
    const redirectStatus = params.get("redirect_status");
    if (!clientSecret || redirectStatus !== "succeeded") return;

    let cancelled = false;
    (async () => {
      const stripe = await getStripeClient();
      if (!stripe || cancelled) return;
      const { setupIntent, error } = await stripe.retrieveSetupIntent(clientSecret);
      if (error || !setupIntent || cancelled) {
        if (error) toast.error(error.message ?? "Couldn't verify card update");
        return;
      }
      const pmId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method?.id;
      if (!pmId) {
        toast.error("Card update incomplete — no payment method");
        return;
      }
      try {
        const res = await fetch("/api/billing/payment-method/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethodId: pmId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          toast.error(data.error || "Failed to save payment method");
          return;
        }
        toast.success("Payment method updated");
        if (data.paymentMethod) {
          setStatus((prev) =>
            prev ? { ...prev, paymentMethod: data.paymentMethod } : prev
          );
        }
        await refetchStatus();
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Request failed");
        }
      } finally {
        // Strip the Stripe query params from the URL so a page
        // refresh doesn't re-run this effect and double-confirm.
        const url = new URL(window.location.href);
        url.searchParams.delete("setup_intent");
        url.searchParams.delete("setup_intent_client_secret");
        url.searchParams.delete("redirect_status");
        url.searchParams.delete("billing");
        window.history.replaceState({}, "", url.toString());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refetchStatus]);

  async function handleStartUpdatePm() {
    setPmLoading(true);
    try {
      const res = await fetch("/api/billing/payment-method", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        toast.error(data.error || "Couldn't start payment update");
        setPmLoading(false);
        return;
      }
      setPmClientSecret(data.clientSecret);
      setShowUpdatePm(true);
      setPmLoading(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
      setPmLoading(false);
    }
  }

  function handleCancelPmUpdate() {
    setShowUpdatePm(false);
    setPmClientSecret(null);
  }

  async function handlePmUpdateSuccess(newPm: BillingStatus["paymentMethod"] | null) {
    setShowUpdatePm(false);
    setPmClientSecret(null);
    toast.success("Payment method updated");
    // Apply the new PM from the confirm response directly so the UI
    // updates instantly — then refetch in the background to catch
    // any other state changes (e.g., subscription status).
    if (newPm) {
      setStatus((prev) => (prev ? { ...prev, paymentMethod: newPm } : prev));
    }
    await refetchStatus();
  }

  async function handleConfirmCancel() {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cancellation failed");
        setCancelLoading(false);
        return;
      }
      toast.success("Subscription will end at the end of your billing cycle");
      setConfirmingCancel(false);
      await refetchStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleResubscribe() {
    setResubLoading(true);
    try {
      const res = await fetch("/api/billing/resubscribe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Couldn't reactivate");
        setResubLoading(false);
        return;
      }
      toast.success("Subscription reactivated");
      await refetchStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setResubLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-dim)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading billing&hellip;
        </div>
      </div>
    );
  }

  if (!status || !status.hasSubscription) return null;

  const pm = status.paymentMethod;

  return (
    <div className="mt-8 pt-6 border-t border-[var(--color-border)] space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">
          Manage subscription
        </p>

        {/* Cancel-at-period-end banner */}
        {status.cancelAtPeriodEnd && (
          <div className="mb-4 p-4 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  Subscription ending
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  Your subscription is scheduled to cancel on{" "}
                  <strong>{formatDate(status.currentPeriodEnd)}</strong>. You
                  keep full access until then.
                </p>
                <button
                  onClick={handleResubscribe}
                  disabled={resubLoading}
                  className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-amber-900 dark:text-amber-200 hover:underline disabled:opacity-50"
                >
                  {resubLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Reactivate subscription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment method */}
      <div>
        <p className="text-xs text-[var(--color-text-dim)] font-medium mb-2">
          PAYMENT METHOD
        </p>
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </div>
            <div className="min-w-0">
              {pm ? (
                <>
                  <p className="text-sm font-medium truncate">
                    {formatBrand(pm.brand)} &bull;&bull;&bull;&bull; {pm.last4}
                  </p>
                  <p className="text-xs text-[var(--color-text-dim)]">
                    Expires {String(pm.expMonth).padStart(2, "0")}/
                    {String(pm.expYear).slice(-2)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  No card on file
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleStartUpdatePm}
            disabled={pmLoading || showUpdatePm}
            className="text-xs text-[var(--color-accent)] font-medium hover:underline disabled:opacity-50"
          >
            {pmLoading ? "Preparing\u2026" : pm ? "Update" : "Add card"}
          </button>
        </div>

        {/* Inline Payment Element for card replacement */}
        {showUpdatePm && pmClientSecret && (
          <div className="mt-4">
            <Elements
              stripe={getStripeClient()}
              options={{
                clientSecret: pmClientSecret,
                appearance: STRIPE_APPEARANCE,
              }}
            >
              <UpdatePaymentForm
                onSuccess={handlePmUpdateSuccess}
                onCancel={handleCancelPmUpdate}
              />
            </Elements>
          </div>
        )}
      </div>

      {/* Cancel subscription */}
      {!status.cancelAtPeriodEnd && (
        <div>
          <p className="text-xs text-[var(--color-text-dim)] font-medium mb-2">
            CANCELLATION
          </p>
          {!confirmingCancel ? (
            <button
              onClick={() => setConfirmingCancel(true)}
              className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-red-600 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel subscription
            </button>
          ) : (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-950/20">
              <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                Cancel your subscription?
              </p>
              <p className="text-xs text-red-800 dark:text-red-300 mb-3 leading-relaxed">
                You&apos;ll keep full access until{" "}
                <strong>{formatDate(status.currentPeriodEnd)}</strong>. After
                that, your account reverts to the free plan.
              </p>
              <p className="text-xs text-red-800 dark:text-red-300 mb-4 leading-relaxed">
                <strong>Your saved data stays put but becomes inaccessible</strong>{" "}
                on the free plan — saved lists, outcome history, and pipeline
                tracking are locked until you re-subscribe. Nothing is
                deleted; everything is waiting for you the moment you
                reactivate. You can reactivate any time before the end date
                with a single click.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingCancel(false)}
                  disabled={cancelLoading}
                  className="flex-1 text-xs font-medium px-4 py-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] disabled:opacity-50 transition-all"
                >
                  Keep subscription
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancelLoading}
                  className="flex-1 text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-1.5"
                >
                  {cancelLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inner form rendered inside <Elements> for PM updates ────────────
function UpdatePaymentForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (
    newPm: BillingStatus["paymentMethod"] | null
  ) => void | Promise<void>;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    // redirect: 'if_required' keeps the user on the settings page when
    // the card doesn't need 3DS. If it does, Stripe redirects and the
    // return_url handles the rest via the confirm endpoint.
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/settings?billing=pm-updated`,
      },
    });

    if (error) {
      toast.error(error.message ?? "Card validation failed");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;

    if (!paymentMethodId) {
      toast.error("Stripe returned no payment method");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    // Tell the server to attach + set as default + detach the old PM.
    try {
      const res = await fetch("/api/billing/payment-method/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save payment method");
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
      await onSuccess(data.paymentMethod ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]"
    >
      <PaymentElement options={{ layout: "tabs" }} />
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 text-xs font-medium px-4 py-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] disabled:opacity-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || submitting}
          className="flex-1 text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-1.5"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving&hellip;
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Save card
            </>
          )}
        </button>
      </div>
    </form>
  );
}
