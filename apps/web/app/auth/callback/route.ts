import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";

/**
 * Allowed `next` redirect destinations after successful auth. We don't
 * let callers pass arbitrary URLs — open-redirect vulnerabilities get
 * abused for phishing. Anything not on this allowlist falls back to
 * /dashboard.
 *
 * Check pathname prefix, not the full URL, so query-string variants like
 * `/auth/checkout?plan=pro` still match `/auth/checkout`.
 */
const NEXT_ALLOWLIST = [
  "/dashboard",
  "/auth/checkout",
  "/checkout",
  "/lists",
  "/settings",
];

function sanitizeNext(next: string | null): string {
  if (!next) return "/dashboard";
  // Must be a relative path — no protocol-absolute or scheme-absolute URLs
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  const pathname = next.split("?")[0];
  if (NEXT_ALLOWLIST.some((allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`))) {
    return next;
  }
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Failed code exchange — log to Sentry so we can spot patterns
    // (expired codes, revoked tokens, Supabase outages, etc.)
    Sentry.captureException(error, {
      tags: { route: "auth/callback", reason: "exchange_failed" },
    });
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
