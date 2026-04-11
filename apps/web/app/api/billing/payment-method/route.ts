import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/billing/payment-method
 *
 * Creates a SetupIntent on the user's Stripe customer and returns
 * its clientSecret. The settings page mounts a Stripe Payment Element
 * with that secret so the user can add/replace their card without
 * leaving the app. After the client successfully confirms the setup,
 * it calls /api/billing/payment-method/confirm with the new payment
 * method ID so we can set it as the customer default.
 */
export async function POST() {
  try {
    return await handleCreateSetup();
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "api/billing/payment-method" },
    });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleCreateSetup() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const stripe = getStripe();

  // Lazily create a Stripe customer if the user doesn't have one yet.
  // Usually they do (they subscribed via /checkout), but covering the
  // edge case keeps this endpoint independent of the subscribe flow.
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

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
  });

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
  });
}
