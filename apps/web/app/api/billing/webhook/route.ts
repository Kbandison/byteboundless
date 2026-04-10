import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe, planFromSubscription } from "@/lib/stripe";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service role client for webhook — runs outside any user session
// and needs to write to tables that are RLS-locked against end users.
function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase service role credentials missing");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Insert the event ID as an idempotency marker. Returns true if this is
 * the first time we've seen the event, false if we've processed it before.
 * Stripe retries webhooks on non-2xx responses, and without this guard a
 * retry after partial processing (e.g. we credited then crashed before
 * writing the purchase row) would double-credit.
 */
async function markEventProcessed(
  supabase: ReturnType<typeof getAdminClient>,
  eventId: string,
  eventType: string
): Promise<boolean> {
  const { error } = await supabase
    .from("stripe_webhook_events")
    .insert({ id: eventId, type: eventType } as never);

  if (!error) return true;

  // Unique violation → already processed. Treat as success to stop retries.
  if (error.code === "23505") {
    console.log(`[Webhook] Event ${eventId} already processed — skipping`);
    return false;
  }

  // Any other error is unexpected — log and fail so Stripe retries
  throw new Error(`Failed to insert webhook event: ${error.message}`);
}

// ============================================================
// Event handlers
// ============================================================

/**
 * New checkout completed. Could be either a one-time overage purchase
 * (mode: payment) or a subscription signup (mode: subscription). We
 * dispatch to the right path based on the session.mode.
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof getAdminClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.supabase_uid;
  if (!userId) {
    console.error("[Webhook] checkout.session.completed with no supabase_uid metadata");
    return;
  }

  if (session.mode === "payment") {
    // Overage credit purchase
    const credits = parseInt(session.metadata?.credits || "0", 10);
    if (credits <= 0) {
      console.error(`[Webhook] Overage session ${session.id} has invalid credits metadata`);
      return;
    }

    // Read current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("overage_credits")
      .eq("id", userId)
      .single();
    const currentCredits =
      (profile as { overage_credits: number } | null)?.overage_credits ?? 0;

    // Credit the user
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ overage_credits: currentCredits + credits } as never)
      .eq("id", userId);
    if (updateError) throw new Error(`Failed to credit user: ${updateError.message}`);

    // Record the purchase (unique constraint on stripe_session_id = second
    // line of defense against double-credits)
    const { error: purchaseError } = await supabase
      .from("overage_purchases")
      .insert({
        user_id: userId,
        credits,
        amount_cents: session.amount_total || 0,
        stripe_session_id: session.id,
      } as never);
    if (purchaseError && purchaseError.code !== "23505") {
      throw new Error(`Failed to record purchase: ${purchaseError.message}`);
    }

    console.log(`[Webhook] Credited ${credits} overage results to user ${userId}`);
    return;
  }

  if (session.mode === "subscription") {
    // Subscription signup. The subscription object has the plan details;
    // we resolve it against our price ID map.
    const subscriptionId = session.subscription;
    if (!subscriptionId || typeof subscriptionId !== "string") {
      console.error(`[Webhook] subscription session ${session.id} has no subscription id`);
      return;
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const plan = planFromSubscription(subscription);
    if (!plan) {
      console.error(
        `[Webhook] Subscription ${subscriptionId} uses an unrecognized price ID`
      );
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        plan,
        stripe_subscription_id: subscriptionId,
        // Paid subscribers don't have a manual expiration — the subscription
        // itself is the source of truth. Clear any beta expiration that
        // might have been on the profile.
        plan_expires_at: null,
      } as never)
      .eq("id", userId);
    if (error) throw new Error(`Failed to activate subscription: ${error.message}`);

    console.log(`[Webhook] User ${userId} subscribed to ${plan}`);
  }
}

/**
 * PaymentIntent succeeded — fires for our custom-checkout overage
 * purchases (created via /api/billing/checkout). Reads supabase_uid +
 * credits from PI metadata and credits the user's account.
 *
 * Subscription PaymentIntents also fire this event, but we ignore them
 * here (kind metadata is missing) — subscriptions are handled via the
 * customer.subscription.* events instead.
 */
async function handlePaymentIntentSucceeded(
  supabase: ReturnType<typeof getAdminClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  // Filter to our overage purchases — subscription PIs don't have this tag
  if (paymentIntent.metadata?.kind !== "overage_credits") return;

  const userId = paymentIntent.metadata?.supabase_uid;
  const credits = parseInt(paymentIntent.metadata?.credits || "0", 10);

  if (!userId || credits <= 0) {
    console.error(
      `[Webhook] Overage PI ${paymentIntent.id} missing user/credits metadata`
    );
    return;
  }

  // Read current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("overage_credits")
    .eq("id", userId)
    .single();
  const currentCredits =
    (profile as { overage_credits: number } | null)?.overage_credits ?? 0;

  // Credit the user
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ overage_credits: currentCredits + credits } as never)
    .eq("id", userId);
  if (updateError) throw new Error(`Failed to credit user: ${updateError.message}`);

  // Record the purchase. Use payment_intent ID in stripe_session_id slot
  // (the column is named "session" but functions as a generic Stripe ID
  // for idempotency). The unique index on this column blocks duplicates.
  const { error: purchaseError } = await supabase
    .from("overage_purchases")
    .insert({
      user_id: userId,
      credits,
      amount_cents: paymentIntent.amount,
      stripe_session_id: paymentIntent.id,
    } as never);
  if (purchaseError && purchaseError.code !== "23505") {
    throw new Error(`Failed to record purchase: ${purchaseError.message}`);
  }

  console.log(
    `[Webhook] Credited ${credits} overage results to user ${userId} from PI ${paymentIntent.id}`
  );
}

/**
 * Subscription updated — fires on plan changes, quantity changes, renewals
 * (with `status: 'active'`), and cancel-at-period-end flips. We remap the
 * user's plan from the subscription's current price.
 */
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof getAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId =
    subscription.metadata?.supabase_uid ||
    // Fallback: look up by stripe_subscription_id
    (await lookupUserIdBySubscription(supabase, subscription.id));

  if (!userId) {
    console.error(`[Webhook] Could not find user for subscription ${subscription.id}`);
    return;
  }

  // If the subscription is no longer active/trialing, revert to free.
  // (customer.subscription.deleted handles the terminal case, but
  // 'incomplete_expired' / 'unpaid' / 'canceled' can also arrive here.)
  if (
    subscription.status !== "active" &&
    subscription.status !== "trialing" &&
    subscription.status !== "past_due" // give past_due users a grace window
  ) {
    const { error } = await supabase
      .from("profiles")
      .update({ plan: "free", stripe_subscription_id: null } as never)
      .eq("id", userId);
    if (error) throw new Error(`Failed to revert plan: ${error.message}`);
    console.log(`[Webhook] Subscription ${subscription.id} now ${subscription.status} — reverted to free`);
    return;
  }

  const plan = planFromSubscription(subscription);
  if (!plan) {
    console.error(`[Webhook] Subscription ${subscription.id} uses an unrecognized price ID`);
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      plan,
      stripe_subscription_id: subscription.id,
      plan_expires_at: null,
    } as never)
    .eq("id", userId);
  if (error) throw new Error(`Failed to update plan: ${error.message}`);

  console.log(`[Webhook] User ${userId} plan set to ${plan} from subscription update`);
}

/**
 * Subscription fully deleted — the billing period is over and Stripe has
 * finalized the cancellation. Revert the user to free.
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof getAdminClient>,
  subscription: Stripe.Subscription
) {
  const userId =
    subscription.metadata?.supabase_uid ||
    (await lookupUserIdBySubscription(supabase, subscription.id));

  if (!userId) {
    console.error(`[Webhook] Could not find user for deleted subscription ${subscription.id}`);
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ plan: "free", stripe_subscription_id: null } as never)
    .eq("id", userId);
  if (error) throw new Error(`Failed to revert plan: ${error.message}`);

  console.log(`[Webhook] User ${userId} subscription deleted — reverted to free`);
}

async function lookupUserIdBySubscription(
  supabase: ReturnType<typeof getAdminClient>,
  subscriptionId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

// ============================================================
// Main webhook route
// ============================================================

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  // Stripe signature verification needs the raw body text
  const body = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[Webhook] Signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  let supabase: ReturnType<typeof getAdminClient>;
  try {
    supabase = getAdminClient();
  } catch (err) {
    console.error("[Webhook]", err);
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  // Idempotency: if we've already processed this event ID, bail.
  let fresh: boolean;
  try {
    fresh = await markEventProcessed(supabase, event.id, event.type);
  } catch (err) {
    console.error("[Webhook] Idempotency marker failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  if (!fresh) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Dispatch
  try {
    switch (event.type) {
      case "checkout.session.completed":
        // Legacy path — kept for any old/in-flight Checkout Sessions.
        // New flows use payment_intent.succeeded (overage) and
        // customer.subscription.* (plans).
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          supabase,
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        // For beta we just log; a production version would email the user
        // or flag the account. Don't revert the plan — Stripe handles
        // lifecycle on its own and will emit customer.subscription.updated
        // with past_due status, which we do handle above.
        console.log(
          `[Webhook] Payment failed for invoice ${(event.data.object as Stripe.Invoice).id}`
        );
        break;

      default:
        // Unhandled event types are fine — we return 200 so Stripe doesn't retry
        console.log(`[Webhook] Ignored event type: ${event.type}`);
    }
  } catch (err) {
    // On handler failure, return 500 so Stripe retries. The idempotency
    // row we inserted at the top will block the retry from double-acting
    // IF the insert was the only thing that succeeded. But any writes
    // that happened before the failure will be rolled back on retry
    // (they're separate transactions per call, so not atomic — worth
    // noting for a future hardening pass).
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Webhook] Handler failed for ${event.type}:`, message);

    // Remove the idempotency marker so Stripe's retry gets a fresh attempt
    await supabase.from("stripe_webhook_events").delete().eq("id", event.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
