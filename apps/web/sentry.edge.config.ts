// Sentry Edge runtime configuration.
// Runs in Next.js middleware (proxy.ts in v16) and any route configured
// with `export const runtime = "edge"`. Different bundle constraints
// than the Node runtime, so Sentry has a separate entry point.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === "production",

  tracesSampleRate: 0.1,

  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV || "development",

  sendDefaultPii: false,
});
