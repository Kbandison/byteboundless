// Sentry browser runtime configuration.
// Runs on every page load in the client. Any exception that bubbles up
// from React, event handlers, or fetch calls gets reported here.
//
// See docs/sentry.md for setup instructions (DSN, env vars, how to verify
// it's working in dev and prod).

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Don't run Sentry in local dev — it just spams errors for things like
  // React Strict Mode double-invocations and Turbopack HMR noise.
  // Flip the env check to `process.env.NODE_ENV !== "production"` to
  // invert, or remove entirely if you want dev errors too.
  enabled: process.env.NODE_ENV === "production",

  // Sample rate: capture 100% of errors, 10% of performance traces.
  // Bump tracesSampleRate to 1.0 if you're actively debugging perf.
  tracesSampleRate: 0.1,

  // Release tracking — Vercel injects VERCEL_GIT_COMMIT_SHA automatically.
  // Lets you see "this error first appeared in commit abc123" in Sentry.
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Environment separation in Sentry — "production", "preview", "development"
  environment: process.env.VERCEL_ENV || "development",

  // Don't send PII by default. If you later want to tag errors with user
  // ID for debugging, set `initialScope.user.id` in a client-side effect
  // once the user is loaded. Emails and names stay out of Sentry.
  sendDefaultPii: false,

  // Filter out noisy / expected errors that aren't actionable.
  ignoreErrors: [
    // Extensions injecting scripts
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Browser extensions throwing from their injected code
    /chrome-extension:\/\//,
    /moz-extension:\/\//,
    // Network errors from aborted fetches (user navigates away)
    "AbortError",
    "NetworkError when attempting to fetch resource",
  ],
});
