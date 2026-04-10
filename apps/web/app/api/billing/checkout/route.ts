import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const CREDITS_PER_PACK = 200;
const PRICE_CENTS = 400; // $4.00

/**
 * POST /api/billing/checkout
 *
 * Creates a one-time PaymentIntent for 200 extra search results ($4)
 * and returns its client_secret. The /checkout page mounts a Stripe
 * Payment Element with that client_secret so the user pays inside our
 * own custom UI (no redirect to Stripe-hosted checkout).
 *
 * On successful payment, the webhook handles `payment_intent.succeeded`
 * and credits the user's account based on metadata.
 *
 * For subscription upgrades, use POST /api/billing/subscribe instead.
 */
export async function POST() {
  try {
    return await handleCheckout();
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/billing/checkout" },
    });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleCheckout() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Billing not configured";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  // Get or create the Stripe customer (reuse profile's stripe_customer_id)
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as {
    stripe_customer_id: string | null;
    email: string;
  } | null;
  if (!profile) {
    Sentry.captureMessage("Profile not found in checkout", {
      level: "warning",
      tags: { route: "api/billing/checkout", user_id: user.id },
    });
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

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

  // Create the PaymentIntent. Metadata carries everything the webhook
  // needs to credit the right user with the right number of credits.
  const paymentIntent = await stripe.paymentIntents.create({
    amount: PRICE_CENTS,
    currency: "usd",
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    description: `${CREDITS_PER_PACK} Extra Search Results`,
    metadata: {
      supabase_uid: user.id,
      credits: String(CREDITS_PER_PACK),
      kind: "overage_credits",
    },
  });

  if (!paymentIntent.client_secret) {
    Sentry.captureMessage("PaymentIntent created without client_secret", {
      level: "error",
      tags: {
        route: "api/billing/checkout",
        payment_intent_id: paymentIntent.id,
        user_id: user.id,
      },
    });
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amountCents: PRICE_CENTS,
    credits: CREDITS_PER_PACK,
  });
}
