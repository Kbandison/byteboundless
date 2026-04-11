// Sentry Node.js runtime configuration.
// Runs in Next.js API routes, server components, and server actions.
// Captures any unhandled error or rejection from server-side code.

import * as Sentry from "@sentry/nextjs";

// Keys that MUST NEVER end up in Sentry extras/tags/contexts — they
// can contain user-entered content (emails, free-text search queries,
// business data) or direct PII. sendDefaultPii: false already blocks
// cookies/headers/IPs, but extras we pass ourselves are not covered
// by that flag. The beforeSend hook below walks every event and
// redacts these keys before shipping to Sentry.
const PII_KEYS = new Set([
  "email",
  "user_email",
  "userEmail",
  "query",
  "location",
  "subject",
  "message",
  "body",
  "phone",
  "address",
  "fullName",
  "full_name",
  "businessName",
  "business_name",
  "draftEmail",
  "draft_email",
  "pitchAngle",
  "pitch_angle",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scrub(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(scrub);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEYS.has(key)) {
      out[key] = "[redacted]";
    } else {
      out[key] = scrub(value);
    }
  }
  return out;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === "production",

  tracesSampleRate: 0.1,

  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV || "development",

  sendDefaultPii: false,

  // Walk every outbound event and redact PII keys from extras,
  // contexts, and tags. Defense in depth — sendDefaultPii handles
  // the built-in Sentry-collected PII (headers, cookies, IP), this
  // handles the extras/tags we pass explicitly.
  beforeSend(event) {
    if (event.extra) event.extra = scrub(event.extra);
    if (event.contexts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event.contexts = scrub(event.contexts) as any;
    }
    if (event.tags) {
      const cleanTags: Record<string, string | number | boolean | null | undefined> = {};
      for (const [key, value] of Object.entries(event.tags)) {
        cleanTags[key] = PII_KEYS.has(key)
          ? "[redacted]"
          : (value as string | number | boolean | null | undefined);
      }
      event.tags = cleanTags;
    }
    return event;
  },
});
