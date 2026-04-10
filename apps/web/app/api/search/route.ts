import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@byteboundless/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ScrapeJob = Database["public"]["Tables"]["scrape_jobs"]["Row"];

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { query, location, options } = body;

  if (!query || !location) {
    return NextResponse.json(
      { error: "Query and location are required" },
      { status: 400 }
    );
  }

  // Atomic quota check + consumption. The Postgres function locks the
  // profile row, resets searches_used if the 30-day window has elapsed,
  // and either increments the counter or deducts an overage credit —
  // all in one transaction. Prevents the read-then-update race and
  // self-heals stuck counters from users who never had a reset before.
  const { data: quotaResult, error: quotaError } = await supabase.rpc(
    "consume_search_quota" as never,
    { p_user_id: user.id } as never
  );

  if (quotaError) {
    return NextResponse.json({ error: quotaError.message }, { status: 500 });
  }

  const status = quotaResult as unknown as string;
  if (status === "free_limit") {
    return NextResponse.json(
      { error: "Search limit reached. Upgrade to Pro for 50 searches/month." },
      { status: 403 }
    );
  }
  if (status === "paid_limit") {
    return NextResponse.json(
      { error: "Monthly search limit reached. Purchase extra results from Settings to continue." },
      { status: 403 }
    );
  }
  if (status === "not_found") {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  // status is 'ok' or 'ok_overage' — quota was consumed, proceed

  // Read the profile so we can clamp maxResults to the plan's cap.
  // The quota was already consumed atomically above, so this read is
  // just for the max-results clamp, not for quota enforcement.
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as Profile | null;
  const overageCredits =
    ((profile as Record<string, unknown>)?.overage_credits as number) ?? 0;

  // Enforce plan-based max results limit (overage credits extend the max)
  const planMaxResults: Record<string, number> = { free: 50, pro: 500, agency: 1000 };
  const baseMax = planMaxResults[profile?.plan ?? "free"] ?? 50;
  const maxAllowed = overageCredits > 0 ? baseMax + overageCredits : baseMax;
  const clampedOptions = {
    ...(options ?? { radius: "nearby", maxResults: 50, enrich: true }),
    maxResults: Math.min(options?.maxResults ?? 50, maxAllowed),
  };

  // Create the scrape job
  const { data: jobRaw, error } = await supabase
    .from("scrape_jobs")
    .insert({
      user_id: user.id,
      query,
      location,
      options: clampedOptions,
    } as never)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const job = jobRaw as ScrapeJob;
  return NextResponse.json({ job });
}
