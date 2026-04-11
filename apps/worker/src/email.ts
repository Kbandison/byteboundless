// Email sender for worker-originated notifications (job completion, etc).
// Uses Resend's HTTP API via fetch — no SDK dep so the worker image stays
// small. If RESEND_API_KEY or APP_URL are missing, this no-ops gracefully.

import { Sentry } from "./instrument.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.APP_URL || "https://byteboundless.io";
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "ByteBoundless <hello@byteboundless.io>";

export interface JobCompleteEmailData {
  email: string;
  query: string;
  location: string;
  jobId: string;
  resultCount: number;
  hotCount: number;
  mode?: string; // 'urls' for URL import jobs
}

/**
 * Send the "your search is ready" email. Returns true on success, false
 * on skip (missing config) or failure. Failures are captured to Sentry
 * but don't throw — we don't want to fail a job just because email
 * delivery hiccuped.
 */
export async function sendJobCompleteEmail(
  data: JobCompleteEmailData
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log("[Email] RESEND_API_KEY not set — skipping completion email");
    return false;
  }
  if (!data.email) {
    console.log("[Email] No recipient email — skipping");
    return false;
  }
  // Don't email for empty result sets — too low signal to be worth a
  // "your search is ready" notification.
  if (data.resultCount === 0) {
    console.log(`[Email] Skipping — 0 results for job ${data.jobId}`);
    return false;
  }

  const subject = data.mode === "urls"
    ? `Your enrichment is ready — ${data.resultCount} sites analyzed`
    : `Your search is ready — ${data.query} in ${data.location}`;

  const resultsUrl = `${APP_URL}/search/${data.jobId}/results`;
  const settingsUrl = `${APP_URL}/settings`;

  const html = buildHtml({
    query: data.query,
    location: data.location,
    resultCount: data.resultCount,
    hotCount: data.hotCount,
    resultsUrl,
    settingsUrl,
    mode: data.mode,
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: data.email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Email] Resend returned ${res.status}: ${body}`);
      Sentry.captureMessage("Job complete email failed", {
        level: "warning",
        tags: { context: "send_job_complete_email" },
        extra: { status: res.status, body, jobId: data.jobId },
      });
      return false;
    }

    console.log(`[Email] Sent completion email for job ${data.jobId} to ${data.email}`);
    return true;
  } catch (err) {
    console.error("[Email] Fetch failed:", err);
    Sentry.captureException(err, {
      tags: { context: "send_job_complete_email" },
      extra: { jobId: data.jobId },
    });
    return false;
  }
}

// Build the HTML body. Matches the design system of the auth email
// templates in supabase/email-templates. Table-based layout for
// compatibility with old email clients (Outlook, iOS Mail).
function buildHtml(args: {
  query: string;
  location: string;
  resultCount: number;
  hotCount: number;
  resultsUrl: string;
  settingsUrl: string;
  mode?: string;
}): string {
  const headline = args.mode === "urls"
    ? "Your enrichment is ready"
    : `${args.query} in ${args.location}`;
  const subheadline = args.mode === "urls"
    ? `${args.resultCount} sites analyzed`
    : "Your search is ready";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="text-align: center; padding-bottom: 32px;">
        <span style="font-size: 20px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.03em;">ByteBoundless</span>
      </td>
    </tr>
    <tr>
      <td style="background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E5E5E5; padding: 40px 32px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #0066FF; font-weight: 500;">
          ${subheadline}
        </p>
        <h1 style="margin: 0 0 24px; font-size: 22px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.02em;">
          ${escapeHtml(headline)}
        </h1>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 32px;">
          <tr>
            <td style="padding: 16px; border: 1px solid #E5E5E5; border-radius: 10px; text-align: center; width: 50%;">
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: #1A1A1A; font-family: ui-monospace, SFMono-Regular, monospace;">
                ${args.resultCount}
              </p>
              <p style="margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #AAAAAA;">
                Results
              </p>
            </td>
            <td style="width: 8px;"></td>
            <td style="padding: 16px; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; text-align: center; width: 50%; background-color: rgba(16, 185, 129, 0.05);">
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: #059669; font-family: ui-monospace, SFMono-Regular, monospace;">
                ${args.hotCount}
              </p>
              <p style="margin: 4px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #059669;">
                Hot Leads
              </p>
            </td>
          </tr>
        </table>

        <a href="${args.resultsUrl}" style="display: inline-block; background-color: #0066FF; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: -0.01em;">
          View Results
        </a>

        <p style="margin: 32px 0 0; font-size: 12px; color: #6B6B6B; line-height: 1.5;">
          ${args.hotCount > 0
            ? `${args.hotCount} of your leads scored 80+ — those are the ones most likely to need a website rebuild. Start there.`
            : `No hot leads this time — try a different category or widen your radius.`}
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align: center; padding-top: 24px;">
        <p style="margin: 0; font-size: 11px; color: #AAAAAA; line-height: 1.5;">
          ByteBoundless &mdash; Lead intelligence for freelance web developers
        </p>
        <p style="margin: 4px 0 0; font-size: 11px; color: #AAAAAA;">
          <a href="${args.settingsUrl}" style="color: #AAAAAA; text-decoration: underline;">Manage notifications</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Minimal HTML escaper — only for user-controlled fields (query, location).
// We don't trust user input in email HTML.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
