import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { agentGate, UUID_RE } from "@/lib/agent";

/**
 * GET /api/agent/searches/{id}?min_score=60&has_email=true — a search's
 * progress, and once it's completed, its businesses, highest score first,
 * trimmed to what the assistant needs to pick prospects and write to them.
 * Only the root admin's own searches.
 */

type BusinessRow = {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  unclaimed: boolean;
  lead_score: number;
  lead_reasons: unknown;
  enrichment: Record<string, unknown> | null;
};

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];

/** Scoring reasons as plain sentences ("no website", "not mobile friendly"). */
function reasons(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((r) => {
      if (typeof r === "string") return r;
      if (r && typeof r === "object") {
        const o = r as { detail?: unknown; signal?: unknown };
        return String(o.detail ?? o.signal ?? "");
      }
      return "";
    })
    .filter(Boolean);
}

function shape(b: BusinessRow) {
  const e = b.enrichment ?? {};
  return {
    id: b.id,
    name: b.name,
    category: b.category,
    website: b.website,
    phone: b.phone,
    address: b.address,
    rating: b.rating,
    reviews: b.reviews,
    unclaimed: b.unclaimed,
    lead_score: b.lead_score,
    reasons: reasons(b.lead_reasons),
    emails: strings(e.emails),
    developer_contacts: strings(e.developerContacts),
    site: {
      reachable: e.reachable ?? null,
      has_viewport: e.hasViewport ?? null,
      tech_stack: strings(e.techStack),
      copyright_year: e.copyrightYear ?? null,
      years_stale: e.yearsStale ?? null,
      load_ms: e.loadMs ?? null,
    },
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const gate = await agentGate(request);
    if (gate instanceof NextResponse) return gate;
    const { id } = await params;
    if (!UUID_RE.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: job } = await gate.db
      .from("scrape_jobs")
      .select("id, query, location, status, phase, progress_current, progress_total, error, created_at, completed_at")
      .eq("id", id)
      .eq("user_id", gate.ownerId)
      .maybeSingle();
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const j = job as { status: string };
    if (j.status !== "completed") return NextResponse.json({ search: job, businesses: null });

    const url = new URL(request.url);
    const minScore = Math.max(0, Number(url.searchParams.get("min_score")) || 0);
    const hasEmail = url.searchParams.get("has_email") === "true";

    const { data, error } = await gate.db
      .from("businesses")
      .select("id, name, category, website, phone, address, rating, reviews, unclaimed, lead_score, lead_reasons, enrichment")
      .eq("job_id", id)
      .gte("lead_score", minScore)
      .order("lead_score", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let businesses = ((data ?? []) as BusinessRow[]).map(shape);
    if (hasEmail) businesses = businesses.filter((b) => b.emails.length > 0 || b.developer_contacts.length > 0);

    return NextResponse.json({ search: job, businesses });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/agent/searches/[id] GET" } });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
