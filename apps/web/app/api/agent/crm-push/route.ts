import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { agentGate, UUID_RE } from "@/lib/agent";
import { crmConfig, mapBusinessesToLeads, pushLeadsToCrm } from "@/lib/crm";

/**
 * POST /api/agent/crm-push — send businesses from the root admin's searches
 * to the LuxWeb CRM call list: { business_ids: [...] }. The same mapping and
 * push as the dashboard's "Send to CRM" (external id, pitch angle or top
 * scoring reason, notes), assigned to the studio owner. The CRM skips anyone
 * already on its list or already a contact.
 */

const MAX_PER_PUSH = 100;

export async function POST(request: Request) {
  try {
    const gate = await agentGate(request);
    if (gate instanceof NextResponse) return gate;
    if (!crmConfig()) {
      return NextResponse.json({ error: "CRM is not configured on this deployment" }, { status: 500 });
    }

    const body = (await request.json().catch(() => ({}))) as { business_ids?: unknown };
    const ids = Array.isArray(body.business_ids)
      ? [...new Set(body.business_ids.filter((x): x is string => typeof x === "string" && UUID_RE.test(x)))]
      : [];
    if (ids.length === 0 || ids.length > MAX_PER_PUSH) {
      return NextResponse.json(
        { error: `business_ids: 1 to ${MAX_PER_PUSH} business ids` },
        { status: 400 }
      );
    }

    // Only businesses from the root admin's own searches.
    const { data: rows, error } = await gate.db
      .from("businesses")
      .select(
        "id, name, category, website, phone, address, rating, reviews, lead_score, lead_reasons, enrichment, scrape_jobs!inner(user_id)"
      )
      .in("id", ids)
      .eq("scrape_jobs.user_id", gate.ownerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const businesses = (rows ?? []) as unknown as Parameters<typeof mapBusinessesToLeads>[0];
    if (businesses.length === 0) {
      return NextResponse.json({ error: "No matching businesses" }, { status: 404 });
    }

    const { data: pitches } = await gate.db
      .from("lead_pitches")
      .select("business_id, pitch_angle")
      .in("business_id", businesses.map((b) => b.id));

    const leads = mapBusinessesToLeads(
      businesses,
      (pitches ?? []) as Parameters<typeof mapBusinessesToLeads>[1]
    );
    const result = await pushLeadsToCrm(leads);
    return NextResponse.json({ ...result, sent: leads.length });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/agent/crm-push POST" } });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
