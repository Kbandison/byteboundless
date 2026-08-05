/**
 * Push leads to LuxWeb CRM.
 *
 * ByteBoundless finds and qualifies businesses; the CRM is where calls
 * actually get logged (dial history, dispositions, callbacks, commission).
 * This module hands a business over so nobody re-types it into a spreadsheet.
 *
 * This is studio-internal, NOT a customer feature — it targets one specific
 * CRM. `canPushToCrm` keeps it off every other account.
 */

export type CrmConfig = { url: string; key: string };

/** Configured only where the env vars are set; absent = feature hidden. */
export function crmConfig(): CrmConfig | null {
  const url = process.env.LUXWEB_CRM_URL?.replace(/\/$/, "");
  const key = process.env.LUXWEB_CRM_INGEST_KEY;
  if (!url || !key) return null;
  return { url, key };
}

/**
 * Who is studio staff. Admins always; plus anyone listed in CRM_PUSH_EMAILS,
 * so the setter can send leads without being made a ByteBoundless admin.
 *
 * Deliberately independent of whether the CRM env vars are set — that split is
 * what lets `crmStatus` say *which* half is missing.
 */
export function isCrmOperator(
  email: string | null | undefined,
  role: string | null | undefined,
): boolean {
  if (role === "admin") return true;
  const allowed = (process.env.CRM_PUSH_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && allowed.includes(email.trim().toLowerCase());
}

/** Both halves must hold: the CRM is reachable AND this person may push. */
export function canPushToCrm(
  email: string | null | undefined,
  role: string | null | undefined,
): boolean {
  return !!crmConfig() && isCrmOperator(email, role);
}

export type CrmStatus = {
  enabled: boolean;
  /** LUXWEB_CRM_URL + LUXWEB_CRM_INGEST_KEY are present on this deployment. */
  configured: boolean;
  /** This account is allowed to push. */
  operator: boolean;
};

/**
 * Why the feature is on or off. Reported only to studio staff — a customer
 * shouldn't learn anything about the studio's internal wiring.
 */
export function crmStatus(
  email: string | null | undefined,
  role: string | null | undefined,
): CrmStatus {
  const configured = !!crmConfig();
  const operator = isCrmOperator(email, role);
  return { enabled: configured && operator, configured, operator };
}

export type CrmSetter = {
  email: string;
  name: string;
  role: string;
  isSetter: boolean;
};

/**
 * Who a pushed batch can be assigned to. The owner does the searching here and
 * hands leads to whoever will be dialing them, so the picker needs the CRM's
 * outreach roster.
 */
export async function fetchCrmSetters(): Promise<CrmSetter[]> {
  const config = crmConfig();
  if (!config) return [];
  const res = await fetch(`${config.url}/api/outreach/setters`, {
    headers: { Authorization: `Bearer ${config.key}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = (await res.json().catch(() => ({}))) as { setters?: CrmSetter[] };
  return body.setters ?? [];
}

export type CrmLead = {
  external_id: string;
  business_name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  industry: string | null;
  angle: string | null;
  notes: string | null;
};

type BusinessRow = {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  lead_score: number | null;
  lead_reasons: unknown;
  enrichment: Record<string, unknown> | null;
};

type PitchRow = { business_id: string; pitch_angle: string | null };

/** First contactable address we found — the setter only needs one. */
function primaryEmail(enrichment: Record<string, unknown> | null): string | null {
  const biz = (enrichment?.emails as string[]) ?? [];
  const dev = (enrichment?.developerContacts as string[]) ?? [];
  return [...biz, ...dev].find((e) => e && e.includes("@")) ?? null;
}

/** Context the setter can actually use on the phone, one line. */
function buildNotes(b: BusinessRow): string | null {
  const tech = (b.enrichment?.techStack as string[]) ?? [];
  const parts = [
    b.lead_score != null ? `Score ${b.lead_score}` : null,
    tech.length > 0 ? tech.join(", ") : null,
    b.rating != null ? `${b.rating}★${b.reviews ? ` (${b.reviews} reviews)` : ""}` : null,
    b.address,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * The pitch angle the CRM shows while dialing. Prefers the AI-generated one,
 * falls back to the top scoring reason so the field is rarely empty.
 */
function buildAngle(b: BusinessRow, pitch: string | null): string | null {
  if (pitch) return pitch;
  const reasons = Array.isArray(b.lead_reasons) ? (b.lead_reasons as unknown[]) : [];
  const first = reasons[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "label" in first) {
    return String((first as { label: unknown }).label);
  }
  return null;
}

export function toCrmLead(b: BusinessRow, pitch: string | null): CrmLead {
  return {
    external_id: b.id,
    business_name: b.name,
    phone: b.phone,
    email: primaryEmail(b.enrichment),
    website: b.website,
    industry: b.category,
    angle: buildAngle(b, pitch),
    notes: buildNotes(b),
  };
}

export function mapBusinessesToLeads(
  businesses: BusinessRow[],
  pitches: PitchRow[],
): CrmLead[] {
  const angleById = new Map(pitches.map((p) => [p.business_id, p.pitch_angle]));
  return businesses.map((b) => toCrmLead(b, angleById.get(b.id) ?? null));
}

export type CrmPushResult = {
  imported: number;
  skipped: number;
  conflicts: Array<{ business: string; heldBy: string | null }>;
};

/** POST to the CRM's ingest endpoint. Throws with the CRM's message on failure. */
export async function pushLeadsToCrm(
  leads: CrmLead[],
  assignTo?: string | null,
): Promise<CrmPushResult> {
  const config = crmConfig();
  if (!config) throw new Error("CRM is not configured.");

  const res = await fetch(`${config.url}/api/outreach/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.key}`,
    },
    body: JSON.stringify({
      source: "byteboundless",
      assign_to: assignTo ?? undefined,
      leads,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as Partial<CrmPushResult> & {
    error?: string;
  };
  if (!res.ok) throw new Error(body.error ?? `CRM returned ${res.status}`);

  return {
    imported: body.imported ?? 0,
    skipped: body.skipped ?? 0,
    conflicts: body.conflicts ?? [],
  };
}
