import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@supabase/supabase-js";
import { sendBetaExpirationEmail } from "@/lib/email";

// Daily sweep over beta users (plan='agency' + plan_expires_at set)
// that sends:
//   - 7-day warning when plan_expires_at is between today+6 and today+8
//   - 1-day warning when plan_expires_at is between today and today+2
//   - expired notification once plan_expires_at <= now()
//
// Each user gets each email at most once — tracked on profiles via
// beta_notified_7d / beta_notified_1d / beta_notified_expired (migration
// 015). The flags are reset by grant_beta_access so a user re-granted
// beta mid-cycle goes through the warning sequence again.
//
// Protected by CRON_SECRET via Vercel's standard authorization header.
// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically
// when the env var is set.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

interface BetaProfile {
  id: string;
  email: string;
  plan_expires_at: string;
  beta_notified_7d: boolean;
  beta_notified_1d: boolean;
  beta_notified_expired: boolean;
}

export async function GET(request: Request) {
  try {
    return await handleCron(request);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/cron/beta-expiration" } });
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleCron(request: Request) {
  // Vercel Cron auth — fail CLOSED. If CRON_SECRET isn't set, the
  // endpoint is locked; if the header doesn't match, 401. This is
  // the opposite of the original "fail open when unset" logic, which
  // would let anyone trigger email spam by hitting the URL directly
  // in production if the env var was accidentally unset.
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured — cron endpoint is locked" },
      { status: 503 }
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json(
      { error: "Supabase credentials missing" },
      { status: 503 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // Pull every beta profile — the numbers are small enough that no
  // complex SQL date-range filter is worth the readability cost.
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, email, plan_expires_at, beta_notified_7d, beta_notified_1d, beta_notified_expired"
    )
    .eq("plan", "agency")
    .not("plan_expires_at", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profiles = (data ?? []) as unknown as BetaProfile[];
  const now = Date.now();
  let sent7d = 0;
  let sent1d = 0;
  let sentExpired = 0;
  let skipped = 0;

  for (const p of profiles) {
    if (!p.email || !p.plan_expires_at) {
      skipped++;
      continue;
    }

    const expiresAt = new Date(p.plan_expires_at);
    const msUntilExpiry = expiresAt.getTime() - now;
    const daysUntilExpiry = msUntilExpiry / (1000 * 60 * 60 * 24);

    // Expired: fire as long as we haven't already sent the expired
    // notice for this grant window.
    if (msUntilExpiry <= 0) {
      if (p.beta_notified_expired) {
        skipped++;
        continue;
      }
      const ok = await sendBetaExpirationEmail({
        userId: p.id,
        email: p.email,
        kind: "expired",
        expiresAt,
      });
      if (ok) {
        await supabase
          .from("profiles")
          .update({ beta_notified_expired: true } as never)
          .eq("id", p.id);
        sentExpired++;
      }
      continue;
    }

    // 1-day window: plan expires in the next ~2 days
    if (daysUntilExpiry <= 2) {
      if (p.beta_notified_1d) {
        skipped++;
        continue;
      }
      const ok = await sendBetaExpirationEmail({
        userId: p.id,
        email: p.email,
        kind: "1d",
        expiresAt,
      });
      if (ok) {
        await supabase
          .from("profiles")
          .update({ beta_notified_1d: true } as never)
          .eq("id", p.id);
        sent1d++;
      }
      continue;
    }

    // 7-day window: plan expires between 6 and 8 days from now
    if (daysUntilExpiry <= 8 && daysUntilExpiry > 6) {
      if (p.beta_notified_7d) {
        skipped++;
        continue;
      }
      const ok = await sendBetaExpirationEmail({
        userId: p.id,
        email: p.email,
        kind: "7d",
        expiresAt,
      });
      if (ok) {
        await supabase
          .from("profiles")
          .update({ beta_notified_7d: true } as never)
          .eq("id", p.id);
        sent7d++;
      }
      continue;
    }

    skipped++;
  }

  console.log(
    `[Cron/beta-expiration] Scanned ${profiles.length} beta profiles — sent7d=${sent7d} sent1d=${sent1d} sentExpired=${sentExpired} skipped=${skipped}`
  );

  return NextResponse.json({
    scanned: profiles.length,
    sent: { d7: sent7d, d1: sent1d, expired: sentExpired },
    skipped,
  });
}
