import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@byteboundless/supabase";

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type LeadPitch = Database["public"]["Tables"]["lead_pitches"]["Row"];

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { businessId, regenerate } = body as { businessId?: string; regenerate?: boolean };

  if (!businessId) {
    return NextResponse.json(
      { error: "businessId is required" },
      { status: 400 }
    );
  }

  // Cache hit: return existing pitch without consuming quota, unless the
  // user explicitly asked to regenerate.
  const { data: existingRaw } = await supabase
    .from("lead_pitches")
    .select("*")
    .eq("business_id", businessId)
    .single();
  const existing = existingRaw as LeadPitch | null;

  if (existing && !regenerate) {
    return NextResponse.json({ pitch: existing });
  }

  // Atomic pitch quota check + consumption. The Postgres function locks
  // the profile row, resets pitches_used if the 30-day window has elapsed,
  // and increments the counter if under the limit — all in one transaction.
  const { data: quotaResult, error: quotaError } = await supabase.rpc(
    "consume_pitch_quota" as never,
    { p_user_id: user.id } as never
  );

  if (quotaError) {
    return NextResponse.json({ error: quotaError.message }, { status: 500 });
  }

  const status = quotaResult as unknown as string;
  if (status === "free_limit") {
    return NextResponse.json(
      { error: "Monthly AI pitch limit reached (10). Upgrade to Pro for 200 pitches/month." },
      { status: 403 }
    );
  }
  if (status === "paid_limit") {
    return NextResponse.json(
      { error: "Monthly AI pitch limit reached. Resets in 30 days." },
      { status: 403 }
    );
  }
  if (status === "not_found") {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  // status === 'ok' — per-user quota consumed, proceed

  // Global daily budget ceiling — defense in depth against bugs
  // in consume_pitch_quota, compromised admin accounts, or runaway
  // callers. The value is intentionally generous; its job is to
  // protect from orders-of-magnitude overspend, not to replace the
  // per-user limit above.
  const DAILY_PITCH_BUDGET = parseInt(
    process.env.DAILY_PITCH_BUDGET || "500",
    10
  );
  const { data: budgetCount, error: budgetError } = await supabase.rpc(
    "consume_api_budget" as never,
    { p_kind: "anthropic_pitch", p_limit: DAILY_PITCH_BUDGET } as never
  );
  if (budgetError) {
    console.error("[Pitch] Budget check failed:", budgetError);
    return NextResponse.json(
      { error: "Budget check failed" },
      { status: 500 }
    );
  }
  if ((budgetCount as unknown as number) > DAILY_PITCH_BUDGET) {
    console.warn(
      `[Pitch] Daily budget exceeded (${budgetCount}/${DAILY_PITCH_BUDGET}) — refusing request`
    );
    return NextResponse.json(
      {
        error:
          "AI pitch generation is temporarily unavailable. Daily global budget reached. Please try again tomorrow.",
      },
      { status: 503 }
    );
  }

  // Fetch user profile for pitch personalization (plan no longer needed
  // here; quota enforcement happens in the RPC above).
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("full_name, company_name, phone, website, location, services, years_experience, portfolio_url")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as {
    full_name: string | null; company_name: string | null;
    phone: string | null; website: string | null;
    location: string | null; services: string[] | null;
    years_experience: number | null; portfolio_url: string | null;
  } | null;

  // Fetch business data for the prompt
  const { data: bizRaw, error: bizError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  const business = bizRaw as Business | null;

  if (bizError || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Call Claude API for pitch generation
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "AI pitch generation not configured" },
      { status: 503 }
    );
  }

  const hasWebsite = business.website && business.website !== "None";
  const enrichmentStr = business.enrichment
    ? JSON.stringify(business.enrichment)
    : "No enrichment data (business has no website)";

  const prompt = `You are a freelance web development sales consultant. Analyze this business and generate outreach materials.

Business: ${business.name}
Category: ${business.category || "Unknown"}
Website: ${hasWebsite ? business.website : "NO WEBSITE — this business has no web presence at all"}
Rating: ${business.rating || "N/A"} (${business.reviews || 0} reviews)
Address: ${business.address || "Unknown"}
Unclaimed listing: ${business.unclaimed ? "Yes" : "No"}
Lead Score: ${business.lead_score}/100
Score Reasons: ${JSON.stringify(business.lead_reasons)}
Enrichment Data: ${enrichmentStr}

${hasWebsite
    ? "Generate outreach materials explaining why they need a BETTER website based on the enrichment data."
    : "Generate outreach materials explaining why they NEED a website. They have zero web presence — this is a huge opportunity."}

The freelancer's info for the email signature and pitch context:
Name: ${profile?.full_name || "[Your Name]"}
Company: ${profile?.company_name || "[Your Company]"}
Phone: ${profile?.phone || ""}
Website: ${profile?.website || ""}
Portfolio: ${profile?.portfolio_url || ""}
Location: ${profile?.location || ""}
Services: ${profile?.services?.join(", ") || "Web development"}
Experience: ${profile?.years_experience ? `${profile.years_experience}+ years` : ""}

Return ONLY a raw JSON object (no markdown, no code fences, no explanation) with these exact keys:
{"pitchAngle": "one paragraph", "improvementSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"], "draftEmail": "email text — sign off with the freelancer's real name and company if provided, not [Your Name]"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json(
      { error: `AI generation failed: ${err}` },
      { status: 502 }
    );
  }

  const aiResponse = await response.json();
  let content = aiResponse.content?.[0]?.text ?? "";

  // Strip markdown code fences if Claude wraps the response
  content = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  let pitchData;
  try {
    pitchData = JSON.parse(content);
  } catch {
    // Try to extract JSON from the response if it has surrounding text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        pitchData = JSON.parse(jsonMatch[0]);
      } catch {
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 502 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 502 }
      );
    }
  }

  // If the user regenerated, delete the old cached pitch first so the
  // upsert replaces it cleanly.
  if (existing && regenerate) {
    await supabase.from("lead_pitches").delete().eq("business_id", businessId);
  }

  // Cache the pitch. The INSERT policy from migration 009 checks that the
  // business belongs to one of the user's scrape jobs.
  const { error: insertError } = await (supabase
    .from("lead_pitches") as ReturnType<typeof supabase.from>)
    .insert({
      business_id: businessId,
      pitch_angle: pitchData.pitchAngle,
      improvement_suggestions: pitchData.improvementSuggestions,
      draft_email: pitchData.draftEmail,
    } as never);

  if (insertError) {
    // Cache failed but we still have the pitch. Return it so the user
    // gets value, but log so we can see if RLS is mis-set.
    console.error("lead_pitches insert failed:", insertError);
    return NextResponse.json({ pitch: pitchData });
  }

  return NextResponse.json({
    pitch: {
      business_id: businessId,
      pitch_angle: pitchData.pitchAngle,
      improvement_suggestions: pitchData.improvementSuggestions,
      draft_email: pitchData.draftEmail,
    },
  });
}
