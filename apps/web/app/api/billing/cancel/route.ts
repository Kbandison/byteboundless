import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/billing/cancel
 *
 * Schedules the user's subscription to cancel at the end of the
 * current billing period. They keep access until then; Stripe fires
 * customer.subscription.deleted on the actual period end date, which
 * the webhook handler uses to flip the profile back to 'free'.
 *
 * This is different from an immediate cancellation — we intentionally
 * want the user to get what they paid for through the end of the
 * cycle and to be able to reactivate (via /api/billing/resubscribe)
 * before the period ends.
 */
export async function POST() {
  try {
    return await handleCancel();
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/billing/cancel" } });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleCancel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as { stripe_subscription_id: string | null } | null;

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription to cancel" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  const firstItem = updated.items.data[0];
  const periodEndUnix = firstItem?.current_period_end ?? null;

  return NextResponse.json({
    canceled: true,
    currentPeriodEnd: periodEndUnix
      ? new Date(periodEndUnix * 1000).toISOString()
      : null,
  });
}
