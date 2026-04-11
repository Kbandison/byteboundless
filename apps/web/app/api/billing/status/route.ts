import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe, planFromSubscription } from "@/lib/stripe";

/**
 * GET /api/billing/status
 *
 * Returns the data the settings billing section needs to render
 * native subscription management — no Stripe Billing Portal trip.
 *
 * Response:
 *   {
 *     plan,
 *     hasSubscription,
 *     subscriptionId,
 *     cancelAtPeriodEnd,
 *     currentPeriodEnd, // ISO string or null
 *     paymentMethod: { brand, last4, expMonth, expYear } | null
 *   }
 */
export async function GET() {
  try {
    return await handleStatus();
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/billing/status" } });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("plan, stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as {
    plan: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  } | null;

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // No subscription → return the minimal shape. Beta users and admins
  // have plan='agency' with no Stripe customer, and the billing section
  // renders accordingly.
  if (!profile.stripe_subscription_id || !profile.stripe_customer_id) {
    return NextResponse.json({
      plan: profile.plan,
      hasSubscription: false,
      subscriptionId: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      paymentMethod: null,
    });
  }

  const stripe = getStripe();

  // Fetch the subscription and customer in parallel so the settings
  // page loads in one round trip instead of two.
  const [subscription, customer] = await Promise.all([
    stripe.subscriptions.retrieve(profile.stripe_subscription_id, {
      expand: ["default_payment_method"],
    }),
    stripe.customers.retrieve(profile.stripe_customer_id, {
      expand: ["invoice_settings.default_payment_method"],
    }),
  ]);

  // Derive the period end from the first subscription item — subs
  // with a single item put the period at item level in the 2026 API.
  const firstItem = subscription.items.data[0];
  const periodEndUnix = firstItem?.current_period_end ?? null;

  // Payment method resolution precedence:
  //   1. Subscription's own default_payment_method (if set)
  //   2. Customer's invoice_settings.default_payment_method
  // The second is what new payments fall back to, so it's the most
  // accurate display for "the card that will be charged next."
  const subPm = subscription.default_payment_method;
  const custPm =
    (customer as Stripe.Customer).invoice_settings?.default_payment_method;

  let paymentMethodObj: Stripe.PaymentMethod | null = null;
  if (subPm && typeof subPm !== "string") {
    paymentMethodObj = subPm;
  } else if (custPm && typeof custPm !== "string") {
    paymentMethodObj = custPm as Stripe.PaymentMethod;
  }

  const card = paymentMethodObj?.card ?? null;
  const paymentMethod = card
    ? {
        brand: card.brand,
        last4: card.last4,
        expMonth: card.exp_month,
        expYear: card.exp_year,
      }
    : null;

  return NextResponse.json({
    plan: planFromSubscription(subscription) ?? profile.plan,
    hasSubscription: true,
    subscriptionId: subscription.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
    paymentMethod,
  });
}
