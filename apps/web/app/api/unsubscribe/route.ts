import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * GET/POST /api/unsubscribe?user=<uuid>&kind=<type>&sig=<hmac>
 *
 * One-click unsubscribe endpoint. Supports both browser navigation (GET)
 * for the visible "Unsubscribe" link in the email body, and POST for
 * Gmail/Yahoo's one-click header (List-Unsubscribe-Post), which hits
 * the URL as POST with a specific form body.
 *
 * The `sig` is an HMAC-SHA256 of "<user_id>:<kind>" using
 * SUPABASE_SERVICE_ROLE_KEY as the key. Prevents random people from
 * unsubscribing other users — you can't generate a valid sig without
 * the secret, which only lives on the server.
 *
 * `kind` identifies which preference to toggle off:
 *   - "notify_on_complete" → search-complete emails (opt-out honored)
 *   - "subscription" → Stripe lifecycle emails (transactional, no-op)
 *   - "beta" → beta expiration reminders (transactional, no-op)
 *
 * Transactional kinds still need a working endpoint because Gmail's
 * List-Unsubscribe-Post spec requires the URL to return 200 — but we
 * don't actually turn anything off, because users can't opt out of
 * mandatory lifecycle emails. They just get redirected to /settings.
 *
 * Design: GET redirects to a friendly confirmation page. POST returns
 * 200 with a JSON body so the bulk-unsub button in Gmail doesn't show
 * an error.
 */

const VALID_KINDS = new Set(["notify_on_complete", "subscription", "beta"]);
const TRANSACTIONAL_KINDS = new Set(["subscription", "beta"]);
export async function GET(request: Request) {
  try {
    return await handleUnsubscribe(request, "get");
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/unsubscribe", method: "get" } });
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/unsubscribed?error=server`);
  }
}

export async function POST(request: Request) {
  try {
    return await handleUnsubscribe(request, "post");
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/unsubscribe", method: "post" } });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleUnsubscribe(request: Request, method: "get" | "post") {
  const { searchParams, origin } = new URL(request.url);
  const userId = searchParams.get("user");
  const kind = searchParams.get("kind");
  const sig = searchParams.get("sig");

  if (!userId || !kind || !sig) {
    return errorResponse(method, origin, "Missing parameters");
  }
  if (!VALID_KINDS.has(kind)) {
    return errorResponse(method, origin, "Unknown preference");
  }

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    return errorResponse(method, origin, "Server not configured");
  }

  // Verify the signature
  const expected = createHmac("sha256", secret)
    .update(`${userId}:${kind}`)
    .digest("hex");

  let valid = false;
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(sig, "hex");
    valid = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    valid = false;
  }

  if (!valid) {
    return errorResponse(method, origin, "Invalid signature");
  }

  // Transactional kinds (subscription / beta): sig is valid so we know
  // this came from a real email, but we don't actually flip anything —
  // users can't opt out of lifecycle notifications. Return 200 for POST
  // (Gmail's one-click) and redirect GET to a "manage settings" page.
  if (TRANSACTIONAL_KINDS.has(kind)) {
    if (method === "post") return NextResponse.json({ ok: true });
    return NextResponse.redirect(`${origin}/unsubscribed?kind=${kind}`);
  }

  // Flip the preference off. Service-role client bypasses RLS since
  // this endpoint has no user session (the user is unauthenticated —
  // they just clicked a link in an email).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return errorResponse(method, origin, "Server not configured");
  }
  const admin = createClient(supabaseUrl, secret, {
    auth: { persistSession: false },
  });

  const { error } = await admin
    .from("profiles")
    .update({ notify_on_complete: false } as never)
    .eq("id", userId);

  if (error) {
    return errorResponse(method, origin, "Update failed");
  }

  if (method === "post") {
    // Gmail's one-click unsubscribe POST — spec wants a 200 response
    return NextResponse.json({ ok: true });
  }

  // Browser GET — send to a friendly confirmation page
  return NextResponse.redirect(`${origin}/unsubscribed?kind=${kind}`);
}

function errorResponse(method: "get" | "post", origin: string, reason: string) {
  if (method === "post") {
    return NextResponse.json({ error: reason }, { status: 400 });
  }
  return NextResponse.redirect(`${origin}/unsubscribed?error=${encodeURIComponent(reason)}`);
}
