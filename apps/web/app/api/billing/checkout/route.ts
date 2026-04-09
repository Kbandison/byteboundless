import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const CREDITS_PER_PACK = 200;
const PRICE_CENTS = 400; // $4.00

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  // Get or create Stripe customer
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as { stripe_customer_id: string | null; email: string } | null;
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let customerId = profile.stripe_customer_id;

  if (!customerId) {
    // Create Stripe customer
    const customerRes = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: profile.email,
        "metadata[supabase_uid]": user.id,
      }),
    });
    const customer = await customerRes.json();
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId } as never)
      .eq("id", user.id);
  }

  // Create checkout session for overage credits
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://byteboundless.vercel.app";

  const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: customerId ?? "",
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(PRICE_CENTS),
      "line_items[0][price_data][product_data][name]": `${CREDITS_PER_PACK} Extra Results`,
      "line_items[0][price_data][product_data][description]": "Add 200 extra results to your current search allowance",
      "line_items[0][quantity]": "1",
      success_url: `${origin}/settings?purchase=success`,
      cancel_url: `${origin}/settings?purchase=cancelled`,
      "metadata[supabase_uid]": user.id,
      "metadata[credits]": String(CREDITS_PER_PACK),
    }),
  });

  const session = await sessionRes.json();

  if (!session.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
