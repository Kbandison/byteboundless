import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const CREDITS_PER_PACK = 200;
const PRICE_CENTS = 400; // $4.00

/**
 * POST /api/billing/checkout
 *
 * Creates a one-time payment checkout session for 200 extra search
 * results ($4). Used by paid-plan users to top up when they hit their
 * monthly limit. The webhook credits their account on successful payment.
 *
 * For subscription checkouts (upgrading to Pro/Agency), use
 * POST /api/billing/subscribe instead.
 */
export async function POST(request: Request) {
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

  // Get or create Stripe customer (reuse profile's stripe_customer_id)
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as {
    stripe_customer_id: string | null;
    email: string;
  } | null;
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

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
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: PRICE_CENTS,
          product_data: {
            name: `${CREDITS_PER_PACK} Extra Results`,
            description: "Add 200 extra results to your current search allowance",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/settings?purchase=success`,
    cancel_url: `${origin}/settings?purchase=cancelled`,
    metadata: {
      supabase_uid: user.id,
      credits: String(CREDITS_PER_PACK),
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
