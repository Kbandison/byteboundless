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

  // Check search limits
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileRaw as Profile | null;

  const planSearchLimits: Record<string, number> = { free: 3, pro: 50, agency: 200 };
  const searchLimit = planSearchLimits[profile?.plan ?? "free"] ?? 3;

  const overageCredits = (profile as Record<string, unknown>)?.overage_credits as number ?? 0;

  if (profile && profile.searches_used >= searchLimit) {
    if (profile.plan === "free") {
      return NextResponse.json(
        { error: "Search limit reached. Upgrade to Pro for 50 searches/month." },
        { status: 403 }
      );
    }
    // Paid users can use overage credits
    if (overageCredits <= 0) {
      return NextResponse.json(
        { error: `Monthly search limit reached (${searchLimit}). Purchase extra results from Settings to continue.` },
        { status: 403 }
      );
    }
    // Deduct overage credits (1 search = deducts from overage pool)
    await supabase
      .from("profiles")
      .update({ overage_credits: overageCredits - 1 } as never)
      .eq("id", user.id);
  }

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

  // Increment search count
  if (profile) {
    await supabase
      .from("profiles")
      .update({ searches_used: profile.searches_used + 1 } as never)
      .eq("id", user.id);
  }

  return NextResponse.json({ job });
}
