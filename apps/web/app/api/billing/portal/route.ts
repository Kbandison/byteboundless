import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Billing Portal session and returns its URL. The client
 * redirects to it. In the portal the user can:
 *
 * - Cancel their subscription (cancel_at_period_end — remains active until
 *   the current billing period ends, then customer.subscription.deleted
 *   fires on our webhook and the plan reverts to free)
 * - Update their payment method
 * - Download past invoices
 * - Change plans (if configured in the Stripe Dashboard portal settings)
 *
 * All portal changes come back to us as webhook events that
 * /api/billing/webhook already handles — no additional code needed to
 * process the results of anything done in the portal.
 *
 * Requires a stripe_customer_id on the profile, which gets set either
 * when the user first runs /api/billing/subscribe or /api/billing/checkout.
 * If there's no customer ID yet, returns 409.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as { stripe_customer_id: string | null } | null;

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      {
        error:
          "No Stripe customer found. Start a checkout or purchase overage credits first to set one up.",
      },
      { status: 409 }
    );
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

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/settings?billing=back`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}
