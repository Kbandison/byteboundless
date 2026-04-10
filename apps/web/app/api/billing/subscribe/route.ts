import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLAN_PRICE_IDS } from "@/lib/stripe";

/**
 * POST /api/billing/subscribe
 *
 * Body: { plan: 'pro' | 'agency' }
 *
 * Creates an "incomplete" Stripe Subscription for the user and returns
 * the PaymentIntent client_secret from its initial invoice. The /checkout
 * page mounts a Stripe Payment Element with that client_secret so the
 * user can complete payment inside our own custom UI (no redirect to
 * Stripe-hosted checkout).
 *
 * Webhook handles the rest: customer.subscription.created /
 * subscription.updated fire after payment confirms, our handler flips
 * the user's plan in Supabase.
 *
 * For users who already have a subscription (Pro upgrading to Agency),
 * we route them to the Stripe Billing Portal instead — Stripe's portal
 * handles plan switching natively. Custom checkout is only for NEW
 * subscriptions.
 */
export async function POST(request: Request) {
  try {
    return await handleSubscribe(request);
  } catch (err) {
    // Catch-all so any unexpected Stripe SDK / Supabase error reaches
    // Sentry with route context. The thrown error becomes a 500.
    Sentry.captureException(err, {
      tags: { route: "api/billing/subscribe" },
    });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleSubscribe(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const plan = body.plan as "pro" | "agency" | undefined;

  if (plan !== "pro" && plan !== "agency") {
    return NextResponse.json(
      { error: "Invalid plan — must be 'pro' or 'agency'" },
      { status: 400 }
    );
  }

  const priceId = PLAN_PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `STRIPE_${plan.toUpperCase()}_PRICE_ID is not configured` },
      { status: 503 }
    );
  }

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, stripe_subscription_id")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as {
    stripe_customer_id: string | null;
    email: string;
    stripe_subscription_id: string | null;
  } | null;

  if (!profile) {
    Sentry.captureMessage("Profile not found in subscribe", {
      level: "warning",
      tags: { route: "api/billing/subscribe", user_id: user.id },
    });
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "";

  // Existing subscriber → portal flow for plan changes (Stripe handles
  // proration, payment method reuse, etc. natively).
  if (profile.stripe_subscription_id) {
    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "Subscription exists but no customer ID — contact support" },
        { status: 500 }
      );
    }
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings?subscribe=plan-updated`,
    });
    return NextResponse.json({ portalUrl: portalSession.url });
  }

  // Get or create the Stripe customer
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { supabase_uid: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId } as never)
      .eq("id", user.id);
  }

  // Create the subscription in "incomplete" state — payment hasn't
  // happened yet. The PaymentIntent on the latest invoice carries the
  // client_secret we hand to the browser SDK to confirm payment.
  //
  // payment_settings:
  //   - save_default_payment_method: 'on_subscription' attaches the
  //     successfully-charged payment method to the subscription so it
  //     auto-charges on renewal.
  //
  // expand:
  //   - latest_invoice.payment_intent gives us the PI in one round trip.
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.confirmation_secret"],
    metadata: {
      supabase_uid: user.id,
      plan,
    },
  });

  // Stripe types for `latest_invoice` are a union; narrow to the expanded
  // shape so we can pull the confirmation_secret.
  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
  const clientSecret = latestInvoice?.confirmation_secret?.client_secret;

  if (!clientSecret) {
    Sentry.captureMessage("Subscription created without client_secret", {
      level: "error",
      tags: {
        route: "api/billing/subscribe",
        subscription_id: subscription.id,
        user_id: user.id,
      },
    });
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    clientSecret,
    subscriptionId: subscription.id,
    plan,
  });
}
