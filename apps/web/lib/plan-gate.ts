import { NextResponse } from "next/server";

// Server-side plan gate for routes that expose Pro/Agency-only features.
// Client-side gating (UpgradeGate, isPaidPlan) hides the UI but a free
// user can still call the API directly — this enforces it at the edge.
//
// Typed as 'any' for the supabase client because the app mixes typed and
// untyped clients and the narrower SupabaseClient<Database> generic from
// @byteboundless/supabase doesn't line up with @supabase/supabase-js's
// default generic. We only touch `.from("profiles")`, which exists on
// either shape.
export async function requirePaidPlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<NextResponse | null> {
  const { data } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();
  const plan = (data as { plan?: string } | null)?.plan ?? "free";
  if (plan === "free") {
    return NextResponse.json(
      { error: "This feature requires a Pro or Agency plan" },
      { status: 403 }
    );
  }
  return null;
}
