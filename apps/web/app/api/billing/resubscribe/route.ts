import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/billing/resubscribe
 *
 * Undoes a scheduled cancellation. If the user changed their mind
 * before the period ends, this flips cancel_at_period_end back to
 * false so the subscription continues renewing normally.
 */
export async function POST() {
  try {
    return await handleResubscribe();
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/billing/resubscribe" } });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleResubscribe() {
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
      { error: "No subscription to resubscribe" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: false,
  });

  return NextResponse.json({ resubscribed: true });
}
