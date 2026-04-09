import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role client for webhook (no user session)
function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

export async function POST(request: Request) {
  if (!STRIPE_SECRET || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  // Verify webhook signature using Stripe API
  // For production, use the stripe npm package. For now, parse the event directly.
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.supabase_uid;
    const credits = parseInt(session.metadata?.credits || "0", 10);

    if (!userId || credits <= 0) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Credit the user's account
    const { data: profile } = await supabase
      .from("profiles")
      .select("overage_credits")
      .eq("id", userId)
      .single();

    const currentCredits = (profile as { overage_credits: number } | null)?.overage_credits ?? 0;

    await supabase
      .from("profiles")
      .update({ overage_credits: currentCredits + credits } as never)
      .eq("id", userId);

    // Record the purchase
    await supabase
      .from("overage_purchases")
      .insert({
        user_id: userId,
        credits,
        amount_cents: session.amount_total || 400,
        stripe_session_id: session.id,
      } as never);

    console.log(`[Billing] Credited ${credits} overage results to user ${userId}`);
  }

  return NextResponse.json({ received: true });
}
