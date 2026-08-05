import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canPushToCrm, crmStatus, mapBusinessesToLeads, pushLeadsToCrm } from "@/lib/crm";

/**
 * Send businesses to LuxWeb CRM as prospects on a setter's call list.
 *
 * Studio-internal — gated by `canPushToCrm`, so it stays invisible to every
 * other ByteBoundless account. Reads go through the user's own Supabase client
 * so RLS still decides which businesses they can see.
 */

async function gate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single();
  const profile = data as { email: string; role: string } | null;

  if (!canPushToCrm(profile?.email, profile?.role)) {
    return { error: NextResponse.json({ error: "Not available" }, { status: 403 }) };
  }
  return { supabase, profile };
}

/**
 * Lets the UI decide whether to show the button — and, for studio staff, says
 * *why* it's off. `configured: false` means this deployment is missing
 * LUXWEB_CRM_URL / LUXWEB_CRM_INGEST_KEY (remember Vercel bakes env vars in at
 * deploy time, so adding them needs a redeploy). `operator: false` means the
 * account isn't an admin and isn't in CRM_PUSH_EMAILS.
 *
 * Customers get a bare `enabled: false` — the breakdown would leak how the
 * studio is wired up.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ enabled: false });

  const { data } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single();
  const profile = data as { email: string; role: string } | null;

  const status = crmStatus(profile?.email, profile?.role);
  return NextResponse.json(status.operator ? status : { enabled: false });
}

export async function POST(request: Request) {
  const gated = await gate();
  if ("error" in gated) return gated.error;
  const { supabase, profile } = gated;

  const { businessIds, listId, assignTo } = (await request.json().catch(() => ({}))) as {
    businessIds?: string[];
    listId?: string;
    assignTo?: string;
  };

  // Either an explicit selection or "send this whole list".
  let ids = Array.isArray(businessIds) ? businessIds.filter(Boolean) : [];
  if (ids.length === 0 && listId) {
    const { data } = await supabase
      .from("saved_list_items")
      .select("business_id")
      .eq("list_id", listId);
    ids = ((data ?? []) as { business_id: string }[]).map((r) => r.business_id);
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "Nothing selected" }, { status: 400 });
  }
  // The CRM caps a push at 500 leads.
  if (ids.length > 500) {
    return NextResponse.json(
      { error: "Too many at once — send 500 or fewer." },
      { status: 400 }
    );
  }

  const [{ data: businesses }, { data: pitches }] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        "id, name, category, website, phone, address, rating, reviews, lead_score, lead_reasons, enrichment"
      )
      .in("id", ids),
    supabase.from("lead_pitches").select("business_id, pitch_angle").in("business_id", ids),
  ]);

  const rows = (businesses ?? []) as Parameters<typeof mapBusinessesToLeads>[0];
  if (rows.length === 0) {
    return NextResponse.json({ error: "No matching businesses" }, { status: 404 });
  }

  const leads = mapBusinessesToLeads(
    rows,
    (pitches ?? []) as Parameters<typeof mapBusinessesToLeads>[1]
  );

  try {
    // Whoever pushed owns the leads — they're the one who'll be calling them.
    // An explicit assignTo still wins, for handing a batch to someone else.
    const result = await pushLeadsToCrm(leads, assignTo || profile?.email);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach the CRM";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
