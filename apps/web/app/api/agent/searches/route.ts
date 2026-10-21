import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { agentGate, RADII, type Radius } from "@/lib/agent";

/**
 * GET /api/agent/searches?limit=20 — the root admin's recent searches,
 * newest first, so the assistant can rotate niches and areas without
 * repeating one it ran recently.
 *
 * POST /api/agent/searches — start a search as the root admin:
 *   { query, location, radius?, max_results? }
 * Same path as the dashboard's search: the quota is consumed first (and the
 * search refused at the limit), then a scrape job is queued for the worker.
 * Poll GET /api/agent/searches/{id} for progress and results.
 */

export async function GET(request: Request) {
  try {
    const gate = await agentGate(request);
    if (gate instanceof NextResponse) return gate;

    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));

    const { data, error } = await gate.db
      .from("scrape_jobs")
      .select("id, query, location, status, created_at, completed_at")
      .eq("user_id", gate.ownerId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ searches: data ?? [] });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/agent/searches GET" } });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

const MAX_RESULTS_CAP = 200;

export async function POST(request: Request) {
  try {
    const gate = await agentGate(request);
    if (gate instanceof NextResponse) return gate;

    const body = (await request.json().catch(() => ({}))) as {
      query?: unknown;
      location?: unknown;
      radius?: unknown;
      max_results?: unknown;
    };
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "";
    if (!query || !location || query.length > 120 || location.length > 120) {
      return NextResponse.json(
        { error: "query and location are required (up to 120 characters each)" },
        { status: 400 }
      );
    }
    const radius: Radius = RADII.includes(body.radius as Radius) ? (body.radius as Radius) : "nearby";
    const requested = Number(body.max_results);
    const maxResults = Number.isFinite(requested) && requested > 0
      ? Math.min(Math.floor(requested), MAX_RESULTS_CAP)
      : 60;

    // The same atomic quota check the dashboard runs.
    const { data: quota, error: quotaError } = await gate.db.rpc("consume_search_quota", {
      p_user_id: gate.ownerId,
    });
    if (quotaError) return NextResponse.json({ error: quotaError.message }, { status: 500 });
    if (quota !== "ok" && quota !== "ok_overage") {
      return NextResponse.json(
        { error: `Search quota unavailable (${String(quota)})` },
        { status: 403 }
      );
    }

    const { data: job, error } = await gate.db
      .from("scrape_jobs")
      .insert({
        user_id: gate.ownerId,
        query,
        location,
        // The root admin is on the agency plan, so Lighthouse runs, as it
        // would for a search Kevin starts himself.
        options: { radius, maxResults, enrich: true, runLighthouse: true },
      })
      .select("id, status, created_at")
      .single();
    if (error || !job) {
      return NextResponse.json({ error: error?.message ?? "Could not start the search" }, { status: 500 });
    }

    return NextResponse.json({ search: job });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/agent/searches POST" } });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
