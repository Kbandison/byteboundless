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

  if (profile && profile.searches_used >= profile.searches_limit && profile.plan === "free") {
    return NextResponse.json(
      { error: "Search limit reached. Upgrade to Pro for unlimited searches." },
      { status: 403 }
    );
  }

  // Create the scrape job (type assertions needed until `supabase gen types` is run)
  const { data: jobRaw, error } = await supabase
    .from("scrape_jobs")
    .insert({
      user_id: user.id,
      query,
      location,
      options: options ?? { strict: false, maxResults: 50, enrich: true },
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
