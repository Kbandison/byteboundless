import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe, planFromSubscription, PLAN_PRICE_IDS } from "@/lib/stripe";

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
  const confirmUpgrade = body.confirmUpgrade === true;

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

  // Existing subscriber: verify the sub is actually live before we
  // trust the stored ID. Terminal states (canceled / incomplete_expired)
  // → clear the stale id and fall through to creating a fresh sub.
  if (profile.stripe_subscription_id) {
    let existingSub: Stripe.Subscription | null = null;
    try {
      existingSub = await stripe.subscriptions.retrieve(
        profile.stripe_subscription_id
      );
    } catch (err) {
      // Sub was deleted from Stripe entirely — clear the stale id.
      console.warn(
        `[Subscribe] Stale stripe_subscription_id ${profile.stripe_subscription_id} — clearing`,
        err
      );
    }

    const isLive =
      existingSub &&
      (existingSub.status === "active" ||
        existingSub.status === "trialing" ||
        existingSub.status === "past_due");

    if (isLive && existingSub) {
      if (!profile.stripe_customer_id) {
        return NextResponse.json(
          { error: "Subscription exists but no customer ID — contact support" },
          { status: 500 }
        );
      }

      const currentPriceId = existingSub.items.data[0]?.price.id;
      const newPriceId = PLAN_PRICE_IDS[plan];
      const currentItemId = existingSub.items.data[0]?.id;
      const currentPlan = planFromSubscription(existingSub);

      // Same plan → nothing to do. The only reason someone would land
      // here is by navigating directly — the UI doesn't link to the
      // checkout for the plan you already have. Redirect them to
      // billing settings instead of silently re-checking out.
      if (currentPriceId === newPriceId) {
        return NextResponse.json(
          { error: "You're already on this plan" },
          { status: 400 }
        );
      }

      // Different plan → in-place upgrade or downgrade. Stripe updates
      // the existing subscription item with the new price and creates
      // proration line items for the next invoice. No new Payment
      // Element needed — the customer already has a card on file.
      //
      // Two-step handshake:
      //  1. First POST (no confirmUpgrade flag) returns an "upgrade"
      //     preview so the client can render a confirmation card.
      //  2. Second POST (with confirmUpgrade: true) actually runs
      //     stripe.subscriptions.update and returns { upgraded: true }.
      if (!currentItemId || !newPriceId) {
        return NextResponse.json(
          { error: "Subscription price not configured" },
          { status: 500 }
        );
      }

      if (!confirmUpgrade) {
        // Ask Stripe to compute the proration for this plan change.
        // Using always_invoice here too so the preview matches what
        // we'll actually charge below — otherwise the preview amount
        // and the real invoice could drift.
        //
        // amount_due on the preview is the net charge (upgrade) or
        // zero for downgrades (credit gets held for the next invoice,
        // never a negative charge).
        //
        // If this preview call fails we REFUSE to render the
        // confirmation card — otherwise the user could hit Confirm
        // on a $0 total and get surprise-billed for the real amount.
        // The checkout page's error state catches the 500 and shows
        // a clear "Couldn't start checkout" card with retry.
        const prorationDate = Math.floor(Date.now() / 1000);
        let preview: Stripe.Invoice;
        try {
          preview = await stripe.invoices.createPreview({
            customer: profile.stripe_customer_id,
            subscription: existingSub.id,
            subscription_details: {
              items: [{ id: currentItemId, price: newPriceId }],
              proration_behavior: "always_invoice",
              proration_date: prorationDate,
            },
          });
        } catch (err) {
          console.error("[Subscribe] Proration preview failed:", err);
          Sentry.captureException(err, {
            tags: { route: "api/billing/subscribe", context: "proration_preview" },
          });
          return NextResponse.json(
            { error: "Couldn't compute plan change cost. Please try again." },
            { status: 502 }
          );
        }

        const prorationAmountCents = preview.amount_due;
        const prorationCurrency = preview.currency;
        // Sum the proration line items — if the net credit is larger
        // than the period charge, amount_due is 0 but the user still
        // gets a balance credit that applies to the next real invoice.
        // Detect that so the UI can say so.
        //
        // In the 2026-* API, `proration` moved from the line item
        // root into `line.parent.{invoice_item_details|
        // subscription_item_details}.proration`.
        const prorationLineTotal = preview.lines.data
          .filter((l) => {
            const p = l.parent;
            if (!p) return false;
            return Boolean(
              p.invoice_item_details?.proration ||
                p.subscription_item_details?.proration
            );
          })
          .reduce((sum, l) => sum + l.amount, 0);
        const isCredit = prorationLineTotal < 0;

        return NextResponse.json({
          upgrade: {
            fromPlan: currentPlan,
            toPlan: plan,
            subscriptionId: existingSub.id,
            prorationAmountCents,
            prorationCurrency,
            isCredit,
          },
        });
      }

      // Execute the plan change. proration_behavior=always_invoice
      // creates an invoice for the proration RIGHT NOW and attempts
      // to pay it with the customer's default payment method. For
      // upgrades this bills the difference immediately (matches the
      // preview we showed). For downgrades it creates a zero-or-credit
      // invoice that settles against their next renewal.
      await stripe.subscriptions.update(existingSub.id, {
        items: [{ id: currentItemId, price: newPriceId }],
        proration_behavior: "always_invoice",
        metadata: {
          supabase_uid: user.id,
          plan,
        },
      });

      // Don't flip profile.plan here — the webhook
      // (customer.subscription.updated) is the source of truth and
      // will fire within a second or two. Writing it here too would
      // duplicate logic and create a race if the webhook arrives with
      // a slightly different state.
      return NextResponse.json({ upgraded: true, plan });
    }

    // Not live — drop the stale id and proceed to create a new sub below.
    await supabase
      .from("profiles")
      .update({ stripe_subscription_id: null } as never)
      .eq("id", user.id);
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

  // Idempotency: if this customer already has an incomplete subscription
  // for the SAME plan, reuse it instead of creating another one. This
  // guards against React Strict Mode (which double-fires useEffect and
  // used to create two subs per checkout visit), concurrent tabs, and
  // the user refreshing /checkout. Stripe auto-expires incomplete subs
  // after 23h so orphans still clean themselves up, but while they're
  // alive we must never create duplicates — they can get auto-charged
  // via Smart Retries on the Dashboard and double-bill the user.
  const { data: existingIncomplete } = await stripe.subscriptions.list({
    customer: customerId,
    status: "incomplete",
    limit: 10,
    expand: ["data.latest_invoice.confirmation_secret"],
  });

  const reusable = existingIncomplete.find(
    (s) => s.items.data[0]?.price.id === priceId
  );

  if (reusable) {
    const inv = reusable.latest_invoice as Stripe.Invoice | null;
    const reuseSecret = inv?.confirmation_secret?.client_secret;
    if (reuseSecret) {
      console.log(
        `[Subscribe] Reusing incomplete subscription ${reusable.id} for user ${user.id}`
      );
      return NextResponse.json({
        clientSecret: reuseSecret,
        subscriptionId: reusable.id,
        plan,
        reused: true,
      });
    }
  }

  // Cancel any incomplete subs for DIFFERENT plans this customer has
  // lying around (e.g. they opened /checkout?plan=pro, then changed
  // their mind and came to /checkout?plan=agency). Leaving them alive
  // risks Smart Retries charging the wrong plan later.
  for (const stale of existingIncomplete) {
    if (stale.items.data[0]?.price.id !== priceId) {
      try {
        await stripe.subscriptions.cancel(stale.id);
        console.log(`[Subscribe] Canceled stale incomplete sub ${stale.id}`);
      } catch (err) {
        console.warn(`[Subscribe] Failed to cancel stale sub ${stale.id}:`, err);
      }
    }
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
