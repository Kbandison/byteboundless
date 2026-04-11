// Web-side transactional email helper. Mirrors apps/worker/src/email.ts
// but lives in the web app so the Stripe webhook handler and the beta
// expiration cron can share one sender.
//
// No SDK — plain fetch to Resend's HTTP API. If RESEND_API_KEY is
// missing we log and no-op rather than fail the request.
//
// Deliverability: all emails get List-Unsubscribe headers, a plain-text
// alternative, and a physical postal address. Same hardening pass as
// the worker's sendJobCompleteEmail.

import { createHmac } from "node:crypto";
import * as Sentry from "@sentry/nextjs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://byteboundless.io";
const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS || "ByteBoundless <hello@byteboundless.io>";
const UNSUBSCRIBE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;
const POSTAL_ADDRESS =
  process.env.BUSINESS_POSTAL_ADDRESS ||
  "ByteBoundless &middot; [Set BUSINESS_POSTAL_ADDRESS in env]";

// ============================================================
// Shared helpers
// ============================================================

// Unsubscribe URL is only meaningful for the search-complete emails
// (which honor notify_on_complete). Subscription and beta lifecycle
// emails are transactional and not suppressible, but we still include
// the header so Gmail doesn't penalize us — it points to a generic
// "manage notifications" link instead.
function buildUnsubscribeUrl(userId: string, kind: string): string {
  if (!UNSUBSCRIBE_SECRET) {
    return `${APP_URL}/settings#notifications`;
  }
  const sig = createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(`${userId}:${kind}`)
    .digest("hex");
  return `${APP_URL}/api/unsubscribe?user=${userId}&kind=${kind}&sig=${sig}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface LayoutArgs {
  subheadline: string;
  headline: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl: string;
  footerNote?: string;
}

function layoutHtml(args: LayoutArgs): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(args.subheadline)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="text-align: center; padding-bottom: 32px;">
        <span style="font-size: 20px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.03em;">ByteBoundless</span>
      </td>
    </tr>
    <tr>
      <td style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E5E5E5; padding: 40px 32px;">
        <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #0066FF; font-weight: 500; text-align: center;">
          ${escapeHtml(args.subheadline)}
        </p>
        <h1 style="margin: 0 0 24px; font-size: 22px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.02em; text-align: center;">
          ${escapeHtml(args.headline)}
        </h1>
        ${args.bodyHtml}
        ${args.ctaLabel && args.ctaUrl
          ? `<div style="text-align: center; margin-top: 24px;">
              <a href="${args.ctaUrl}" style="display: inline-block; background-color: #0066FF; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: -0.01em;">
                ${escapeHtml(args.ctaLabel)}
              </a>
            </div>`
          : ""}
        ${args.footerNote
          ? `<p style="margin: 24px 0 0; font-size: 12px; color: #6B6B6B; line-height: 1.5; text-align: center;">${args.footerNote}</p>`
          : ""}
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 24px;">
        <p style="margin: 0; font-size: 11px; color: #AAAAAA; line-height: 1.5;">
          ByteBoundless &mdash; Lead intelligence for freelance web developers
        </p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #888888;">${POSTAL_ADDRESS}</p>
        <p style="margin: 8px 0 0; font-size: 11px; color: #AAAAAA;">
          <a href="${APP_URL}/settings#notifications" style="color: #AAAAAA; text-decoration: underline;">Manage notifications</a>
          &nbsp;&middot;&nbsp;
          <a href="${args.unsubscribeUrl}" style="color: #AAAAAA; text-decoration: underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
  tag: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[Email/${args.tag}] RESEND_API_KEY not set — skipping`);
    return false;
  }
  if (!args.to) {
    console.log(`[Email/${args.tag}] No recipient — skipping`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        headers: {
          "List-Unsubscribe": `<${args.unsubscribeUrl}>, <mailto:unsubscribe@byteboundless.io?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[Email/${args.tag}] Resend ${res.status}: ${body}`);
      Sentry.captureMessage(`Email send failed: ${args.tag}`, {
        level: "warning",
        tags: { context: "web_email", email_kind: args.tag },
        extra: { status: res.status, body },
      });
      return false;
    }
    console.log(`[Email/${args.tag}] Sent to ${args.to}`);
    return true;
  } catch (err) {
    console.error(`[Email/${args.tag}] Fetch failed:`, err);
    Sentry.captureException(err, {
      tags: { context: "web_email", email_kind: args.tag },
    });
    return false;
  }
}

// ============================================================
// Subscription lifecycle
// ============================================================

const PLAN_COPY: Record<string, { label: string; blurb: string }> = {
  pro: {
    label: "Pro",
    blurb: "50 searches/month, 500 results per search, full enrichment, Lighthouse audits, and 200 AI pitches.",
  },
  agency: {
    label: "Agency",
    blurb: "200 searches/month, 1000 results per search, unlimited AI pitches, and priority support.",
  },
};

export async function sendSubscriptionWelcomeEmail(args: {
  userId: string;
  email: string;
  plan: "pro" | "agency";
}): Promise<boolean> {
  const planCopy = PLAN_COPY[args.plan] ?? PLAN_COPY.pro;
  const unsubscribeUrl = buildUnsubscribeUrl(args.userId, "subscription");
  const subject = `Welcome to ByteBoundless ${planCopy.label}`;
  const body = `
    <p style="margin: 0 0 16px; font-size: 14px; color: #1A1A1A; line-height: 1.6;">
      Thanks for subscribing. Your <strong>${planCopy.label}</strong> plan is active now — all features are unlocked and you&apos;re ready to go.
    </p>
    <p style="margin: 0; font-size: 14px; color: #6B6B6B; line-height: 1.6;">
      ${planCopy.blurb}
    </p>
  `;
  const html = layoutHtml({
    subheadline: "Subscription active",
    headline: `Welcome to ${planCopy.label}`,
    bodyHtml: body,
    ctaLabel: "Open dashboard",
    ctaUrl: `${APP_URL}/search/new`,
    unsubscribeUrl,
    footerNote: "Need to cancel or change plans? Visit Settings → Billing at any time.",
  });
  const text = `ByteBoundless

Your ${planCopy.label} plan is active.

${planCopy.blurb}

Open dashboard: ${APP_URL}/search/new
Manage billing: ${APP_URL}/settings#billing

---
${POSTAL_ADDRESS.replace(/&middot;/g, "·")}
`;
  return sendEmail({
    to: args.email,
    subject,
    html,
    text,
    unsubscribeUrl,
    tag: "subscription_welcome",
  });
}

export async function sendSubscriptionPastDueEmail(args: {
  userId: string;
  email: string;
}): Promise<boolean> {
  const unsubscribeUrl = buildUnsubscribeUrl(args.userId, "subscription");
  const subject = "Action needed: your ByteBoundless payment failed";
  const body = `
    <p style="margin: 0 0 16px; font-size: 14px; color: #1A1A1A; line-height: 1.6;">
      We couldn&apos;t charge your card for your ByteBoundless subscription. Your plan is still active for a short grace window, but access will be revoked if payment doesn&apos;t go through.
    </p>
    <p style="margin: 0; font-size: 14px; color: #6B6B6B; line-height: 1.6;">
      Update your payment method in the billing portal to keep your subscription running.
    </p>
  `;
  const html = layoutHtml({
    subheadline: "Payment failed",
    headline: "Your payment couldn't go through",
    bodyHtml: body,
    ctaLabel: "Update payment method",
    ctaUrl: `${APP_URL}/settings#billing`,
    unsubscribeUrl,
  });
  const text = `ByteBoundless

Your subscription payment failed.

Your plan is still active for a short grace window, but access will be revoked if payment doesn't go through. Update your payment method to keep your subscription running.

Manage billing: ${APP_URL}/settings#billing

---
${POSTAL_ADDRESS.replace(/&middot;/g, "·")}
`;
  return sendEmail({
    to: args.email,
    subject,
    html,
    text,
    unsubscribeUrl,
    tag: "subscription_past_due",
  });
}

export async function sendSubscriptionCanceledEmail(args: {
  userId: string;
  email: string;
}): Promise<boolean> {
  const unsubscribeUrl = buildUnsubscribeUrl(args.userId, "subscription");
  const subject = "Your ByteBoundless subscription has been canceled";
  const body = `
    <p style="margin: 0 0 16px; font-size: 14px; color: #1A1A1A; line-height: 1.6;">
      Your subscription has been canceled and your account is back on the free plan. Your saved searches, lists, and outreach history are all still there — you just won&apos;t be able to add new leads until you resubscribe.
    </p>
    <p style="margin: 0; font-size: 14px; color: #6B6B6B; line-height: 1.6;">
      If this was a mistake, or if there&apos;s something we could have done better, hit reply — we read every response.
    </p>
  `;
  const html = layoutHtml({
    subheadline: "Subscription canceled",
    headline: "Sorry to see you go",
    bodyHtml: body,
    ctaLabel: "Resubscribe",
    ctaUrl: `${APP_URL}/pricing`,
    unsubscribeUrl,
  });
  const text = `ByteBoundless

Your subscription has been canceled.

Your account is back on the free plan. Your saved searches, lists, and outreach history are all still there — you just won't be able to add new leads until you resubscribe.

If this was a mistake, or if there's something we could have done better, hit reply — we read every response.

Resubscribe: ${APP_URL}/pricing

---
${POSTAL_ADDRESS.replace(/&middot;/g, "·")}
`;
  return sendEmail({
    to: args.email,
    subject,
    html,
    text,
    unsubscribeUrl,
    tag: "subscription_canceled",
  });
}

// ============================================================
// Beta expiration
// ============================================================

export async function sendBetaExpirationEmail(args: {
  userId: string;
  email: string;
  kind: "7d" | "1d" | "expired";
  expiresAt: Date | null;
}): Promise<boolean> {
  const unsubscribeUrl = buildUnsubscribeUrl(args.userId, "beta");

  const whenText =
    args.kind === "expired"
      ? "has expired"
      : args.kind === "1d"
        ? "expires in 24 hours"
        : "expires in 7 days";

  const subject =
    args.kind === "expired"
      ? "Your ByteBoundless beta access has expired"
      : args.kind === "1d"
        ? "Your ByteBoundless beta access expires tomorrow"
        : "Your ByteBoundless beta access expires in 7 days";

  const dateLabel = args.expiresAt
    ? args.expiresAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const expiredBody = `
    <p style="margin: 0 0 16px; font-size: 14px; color: #1A1A1A; line-height: 1.6;">
      Your closed-beta access to ByteBoundless has expired. Your account is now on the free plan, which is limited to 3 searches and 50 results per search.
    </p>
    <p style="margin: 0 0 16px; font-size: 14px; color: #6B6B6B; line-height: 1.6;">
      Everything you saved during beta is still there — lists, outreach history, past searches. You just can&apos;t run new searches on the paid tier without a subscription.
    </p>
    <p style="margin: 0; font-size: 14px; color: #6B6B6B; line-height: 1.6;">
      If ByteBoundless saved you time, we&apos;d love to keep you on board. Subscribing takes under a minute and comes with a 7-day free trial.
    </p>
  `;

  const warningBody = `
    <p style="margin: 0 0 16px; font-size: 14px; color: #1A1A1A; line-height: 1.6;">
      Heads up — your closed-beta access ${whenText}${dateLabel ? ` (${escapeHtml(dateLabel)})` : ""}. After that, your account reverts to the free plan.
    </p>
    <p style="margin: 0 0 16px; font-size: 14px; color: #6B6B6B; line-height: 1.6;">
      Everything you saved will stay there. But new searches and enrichment will be limited until you subscribe.
    </p>
    <p style="margin: 0; font-size: 14px; color: #6B6B6B; line-height: 1.6;">
      If you&apos;ve been getting value out of the beta, grabbing a subscription now keeps your access uninterrupted.
    </p>
  `;

  const html = layoutHtml({
    subheadline: args.kind === "expired" ? "Beta access expired" : "Beta access expiring",
    headline:
      args.kind === "expired"
        ? "Your beta access has expired"
        : args.kind === "1d"
          ? "24 hours left on your beta access"
          : "7 days left on your beta access",
    bodyHtml: args.kind === "expired" ? expiredBody : warningBody,
    ctaLabel: args.kind === "expired" ? "Subscribe to Pro" : "Subscribe now",
    ctaUrl: `${APP_URL}/pricing`,
    unsubscribeUrl,
  });

  const text = `ByteBoundless

Your beta access ${whenText}${dateLabel ? ` (${dateLabel})` : ""}.

${args.kind === "expired"
  ? "Your account is now on the free plan. Everything you saved is still there, but new searches and enrichment are limited until you subscribe."
  : "After that, your account reverts to the free plan. Everything you saved stays put, but new searches will be limited until you subscribe."}

Subscribe: ${APP_URL}/pricing

---
${POSTAL_ADDRESS.replace(/&middot;/g, "·")}
`;

  return sendEmail({
    to: args.email,
    subject,
    html,
    text,
    unsubscribeUrl,
    tag: `beta_${args.kind}`,
  });
}
