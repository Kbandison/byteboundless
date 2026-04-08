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

  const { businessId } = await request.json();

  if (!businessId) {
    return NextResponse.json(
      { error: "businessId is required" },
      { status: 400 }
    );
  }

  // Check if pitch already cached
  const { data: existingRaw } = await supabase
    .from("lead_pitches")
    .select("*")
    .eq("business_id", businessId)
    .single();

  const existing = existingRaw as LeadPitch | null;
  if (existing) {
    return NextResponse.json({ pitch: existing });
  }

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

  const prompt = `You are a freelance web development sales consultant. Analyze this business and generate outreach materials.

Business: ${business.name}
Category: ${business.category || "Unknown"}
Website: ${business.website || "None"}
Rating: ${business.rating || "N/A"} (${business.reviews || 0} reviews)
Address: ${business.address || "Unknown"}
Unclaimed listing: ${business.unclaimed ? "Yes" : "No"}
Lead Score: ${business.lead_score}/100
Score Reasons: ${JSON.stringify(business.lead_reasons)}
Enrichment Data: ${JSON.stringify(business.enrichment)}

Generate a JSON response with:
1. "pitchAngle": One paragraph explaining why this business needs a new website, using specific data points.
2. "improvementSuggestions": Array of exactly 3 specific, actionable improvement suggestions tied to the enrichment data.
3. "draftEmail": A personalized cold outreach email (under 150 words) that references specific findings about their current website.

Respond ONLY with valid JSON, no markdown.`;

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
  const content = aiResponse.content?.[0]?.text;

  let pitchData;
  try {
    pitchData = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse AI response" },
      { status: 502 }
    );
  }

  // Cache the pitch (type assertions needed until `supabase gen types` is run)
  const { error: insertError } = await (supabase
    .from("lead_pitches") as ReturnType<typeof supabase.from>)
    .insert({
      business_id: businessId,
      pitch_angle: pitchData.pitchAngle,
      improvement_suggestions: pitchData.improvementSuggestions,
      draft_email: pitchData.draftEmail,
    } as never);

  if (insertError) {
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
