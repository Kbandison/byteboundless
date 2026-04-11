import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/billing/payment-method/confirm
 *
 * Called after the client successfully runs stripe.confirmSetup with
 * the SetupIntent from /api/billing/payment-method. Body:
 *   { paymentMethodId: string }
 *
 * Actions:
 *   1. Attach the new PM to the customer (confirmSetup may have
 *      already done this via the SetupIntent, but re-attaching is a
 *      no-op and safer)
 *   2. Set it as the customer's default invoice payment method
 *   3. Also set it as the subscription's default PM so any next
 *      invoice uses it — without this, Stripe may still bill against
 *      the old PM on the subscription until the customer default
 *      propagates
 *   4. Detach the previous default PM so it doesn't linger on the
 *      customer
 */
export async function POST(request: Request) {
  try {
    return await handleConfirm(request);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/billing/payment-method/confirm" },
    });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleConfirm(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const paymentMethodId = body.paymentMethodId as string | undefined;
  if (!paymentMethodId) {
    return NextResponse.json(
      { error: "paymentMethodId is required" },
      { status: 400 }
    );
  }

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as {
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  } | null;

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
  }

  const stripe = getStripe();

  // Look up the current default PM so we can detach it after the new
  // one is in place. Swallow errors here — if we can't read it, we
  // still want the new PM to apply.
  let oldPaymentMethodId: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id);
    const existingDefault = (customer as Stripe.Customer).invoice_settings
      ?.default_payment_method;
    oldPaymentMethodId =
      typeof existingDefault === "string"
        ? existingDefault
        : (existingDefault?.id ?? null);
  } catch (err) {
    console.warn("[PM Confirm] Failed to read existing default PM:", err);
  }

  // 1. Attach (no-op if already attached)
  try {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: profile.stripe_customer_id,
    });
  } catch (err) {
    // If it's already attached to this customer, Stripe returns an
    // error — swallow that specific case.
    const message = err instanceof Error ? err.message : "";
    if (!/already been attached/i.test(message)) {
      throw err;
    }
  }

  // 2. Customer-level default
  await stripe.customers.update(profile.stripe_customer_id, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // 3. Subscription-level default (if they have one)
  if (profile.stripe_subscription_id) {
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      default_payment_method: paymentMethodId,
    });
  }

  // 4. Detach the old PM if it exists and is different
  if (oldPaymentMethodId && oldPaymentMethodId !== paymentMethodId) {
    try {
      await stripe.paymentMethods.detach(oldPaymentMethodId);
    } catch (err) {
      // Non-fatal — the new PM is already in place.
      console.warn(
        `[PM Confirm] Failed to detach old PM ${oldPaymentMethodId}:`,
        err
      );
    }
  }

  // Read the new PM directly from Stripe and return it in the
  // response. This is more reliable than asking the client to refetch
  // /api/billing/status separately — no extra round trip, no risk of
  // Stripe's customer.retrieve still returning stale data mid-update.
  let paymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null = null;
  try {
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.card) {
      paymentMethod = {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      };
    }
  } catch (err) {
    console.warn("[PM Confirm] Failed to read new PM details:", err);
  }

  return NextResponse.json({ success: true, paymentMethod });
}
