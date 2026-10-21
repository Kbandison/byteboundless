import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ROOT_ADMIN_EMAIL } from "@/lib/admin";

/**
 * The LuxWeb assistant's access to ByteBoundless (/api/agent/*): run
 * searches, read the scored results, and push picks to the LuxWeb CRM —
 * what Kevin does by hand from the dashboard.
 *
 * Studio-internal like the CRM push. Authenticated with a shared key
 * (AGENT_API_KEY) instead of a session; every route under /api/agent calls
 * `agentGate` first. The assistant acts as the root admin: its searches are
 * Kevin's, count against his quota, and show up in his search history.
 */

function keyMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch; checking first leaks only
  // the length, which a random key doesn't make useful.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function providedKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return request.headers.get("x-api-key");
}

/** Service-role client: the agent has no session, so RLS can't scope it. */
export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role is not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export type AgentContext = { db: SupabaseClient; ownerId: string };

/**
 * Key check, then the root admin's profile id. Returns the context, or the
 * Response to send back. Fails closed when the key isn't configured.
 */
export async function agentGate(request: Request): Promise<AgentContext | NextResponse> {
  const expected = process.env.AGENT_API_KEY;
  if (!expected) {
    return NextResponse.json({ error: "AGENT_API_KEY not configured" }, { status: 500 });
  }
  const provided = providedKey(request);
  if (!provided || !keyMatches(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = serviceClient();
  const { data } = await db
    .from("profiles")
    .select("id")
    .ilike("email", ROOT_ADMIN_EMAIL)
    .maybeSingle();
  const ownerId = (data as { id: string } | null)?.id;
  if (!ownerId) {
    return NextResponse.json({ error: "Root admin profile not found" }, { status: 500 });
  }
  return { db, ownerId };
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Search radii the worker understands (apps/worker/src/index.ts). */
export const RADII = ["city", "nearby", "region", "statewide"] as const;
export type Radius = (typeof RADII)[number];
