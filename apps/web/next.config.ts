import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Wrap the config with Sentry to enable source map upload and automatic
// instrumentation. Only actually does anything at build time if
// SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT are set — otherwise
// it's a no-op. That means local dev and preview builds stay fast, and
// only production deploys upload source maps.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silence Sentry's build-time logs unless explicitly debugging.
  silent: !process.env.CI,

  // Also upload source maps for Server Component bundles, not just client.
  widenClientFileUpload: true,

  // Annotate React components in the bundle so stack traces show component
  // names instead of minified names.
  reactComponentAnnotation: { enabled: true },

  // Tunnel Sentry requests through a Next.js rewrite so they're less likely
  // to be blocked by ad blockers. Requests go to /monitoring on your domain
  // and Sentry forwards them to sentry.io.
  tunnelRoute: "/monitoring",

  // Don't fail the build if source map upload fails (network blip, missing
  // auth token, etc). Errors still arrive in Sentry, they just won't have
  // un-minified stack traces for that release.
  errorHandler: (err) => {
    console.warn("[Sentry] Source map upload failed:", err);
  },

  disableLogger: true,
});
