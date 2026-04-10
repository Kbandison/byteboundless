// Sentry Node.js runtime configuration.
// Runs in Next.js API routes, server components, and server actions.
// Captures any unhandled error or rejection from server-side code.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === "production",

  tracesSampleRate: 0.1,

  release: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV || "development",

  sendDefaultPii: false,
});
