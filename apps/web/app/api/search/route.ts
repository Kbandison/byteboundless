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

  if (profile && profile.searches_used >= searchLimit) {
    return NextResponse.json(
      { error: `Monthly search limit reached (${searchLimit}). ${profile.plan === "free" ? "Upgrade to Pro for 50 searches/month." : "Your plan resets next billing cycle."}` },
      { status: 403 }
    );
  }

  // Enforce plan-based max results limit
  const planMaxResults: Record<string, number> = { free: 50, pro: 500, agency: 1000 };
  const maxAllowed = planMaxResults[profile?.plan ?? "free"] ?? 50;
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
