import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLAN_PRICE_IDS } from "@/lib/stripe";

/**
 * POST /api/billing/subscribe
 *
 * Body: { plan: 'pro' | 'agency' }
 *
 * Creates a Stripe checkout session in subscription mode and returns
 * the checkout URL. The client redirects to it. On successful payment
 * Stripe fires `checkout.session.completed` + `customer.subscription.created`
 * webhooks which update the user's plan in Supabase.
 */
export async function POST(request: Request) {
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

  // Get or create the Stripe customer (reuses the profile's stripe_customer_id)
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
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // If the user already has an active subscription, don't let them create
  // a second one — they should manage it via the customer portal instead.
  if (profile.stripe_subscription_id) {
    return NextResponse.json(
      {
        error:
          "You already have an active subscription. Manage it from the billing portal.",
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

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?subscribe=success&plan=${plan}`,
    cancel_url: `${origin}/settings?subscribe=cancelled`,
    metadata: {
      supabase_uid: user.id,
      plan,
    },
    // Propagate to the subscription so webhook handlers can find the user
    // even if they only get the subscription object
    subscription_data: {
      metadata: {
        supabase_uid: user.id,
        plan,
      },
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}
