// Sentry initialization for the worker process.
//
// CRITICAL: this file must be imported BEFORE any other user code in
// index.ts (it's the first import). Sentry's integrations instrument
// Node's require/import machinery, and anything imported before
// Sentry.init() won't be tracked.
//
// On Railway (or wherever the worker deploys), set SENTRY_DSN to enable.
// Without a DSN, this file is a no-op and the worker runs unchanged.

import * as Sentry from "@sentry/node";

const DSN = process.env.SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,

    // Worker is always "production-like" since there's no dev server for
    // long-polling background work. But respect NODE_ENV if someone sets it.
    environment: process.env.NODE_ENV || "production",

    // Release tracking — Railway exposes RAILWAY_GIT_COMMIT_SHA for deploys
    // linked to a git repo. Fallback to SHA/COMMIT env vars if you set them
    // manually during build.
    release:
      process.env.RAILWAY_GIT_COMMIT_SHA ||
      process.env.SENTRY_RELEASE ||
      process.env.GIT_COMMIT,

    // Workers don't deal with user PII directly, but keep the default off
    // to be safe.
    sendDefaultPii: false,

    // 10% perf sample rate to stay under the free tier. Trace entries
    // include HTTP calls (outbound to Google Maps, PSI, Supabase) and
    // database queries via the automatic integrations.
    tracesSampleRate: 0.1,

    // Node SDK automatically hooks process.on('uncaughtException') and
    // process.on('unhandledRejection') via the default integrations, so
    // any error that escapes our try/catch blocks still lands in Sentry.
    // We just need to make sure Sentry is initialized before those events
    // can happen — hence the "import this first" rule.
  });

  console.log("[Worker] Sentry initialized");
} else {
  console.log("[Worker] Sentry DSN not set — error monitoring disabled");
}

export { Sentry };
