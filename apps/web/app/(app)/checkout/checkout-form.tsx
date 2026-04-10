"use client";

import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import type { Plan, CheckoutType } from "./order-summary";

interface CheckoutFormProps {
  type: CheckoutType;
  plan: Plan | null;
  onError: (message: string) => void;
}

/**
 * Inner form rendered inside <Elements>. Hosts the Stripe Payment
 * Element and handles the confirmPayment call on submit.
 *
 * On success, Stripe redirects the browser to the configured return_url
 * (which is /settings with a success query param) — we don't render a
 * "thank you" state here because the redirect already moves the user.
 *
 * On failure, errors are shown both inline (from the Payment Element)
 * and via the parent onError callback (toast).
 */
export function CheckoutForm({ type, plan, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  // Build the return URL the user lands on after Stripe finishes payment.
  // Settings page reads these query params and shows a success toast.
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const returnUrl =
    type === "subscription"
      ? `${origin}/settings?subscribe=success&plan=${plan ?? "pro"}`
      : `${origin}/settings?purchase=success`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // If we reach this point, there was an error (success → redirected).
    // 'card_error' / 'validation_error' are user-facing; surface inline
    // and via toast. Other errors get a generic message.
    if (error) {
      const message =
        error.type === "card_error" || error.type === "validation_error"
          ? error.message ?? "Card error"
          : "Something went wrong. Please try again.";
      onError(message);
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-6"
    >
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight mb-1">
        Payment details
      </h2>
      <p className="text-xs text-[var(--color-text-secondary)] mb-6 flex items-center gap-1.5">
        <Lock className="w-3 h-3" />
        Securely processed by Stripe. We never see your card details.
      </p>

      <PaymentElement
        options={{
          layout: "tabs",
          fields: {
            billingDetails: {
              name: "auto",
              email: "auto",
            },
          },
        }}
      />

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full mt-6 inline-flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white text-sm font-semibold px-5 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing&hellip;
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5" />
            {type === "subscription" ? "Subscribe" : "Pay"}
          </>
        )}
      </button>

      <p className="text-[11px] text-[var(--color-text-dim)] mt-3 text-center leading-snug">
        By clicking {type === "subscription" ? "Subscribe" : "Pay"}, you agree to our{" "}
        <a href="/terms" className="text-[var(--color-text-secondary)] underline">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-[var(--color-text-secondary)] underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
