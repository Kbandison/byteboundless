// Next.js instrumentation hook. Called once per runtime (Node.js, Edge)
// before any route or server component runs. We use it to initialize
// Sentry in the matching runtime, which has to happen as early as possible
// so even startup errors get captured.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Required by Sentry's Next.js integration to capture errors thrown
// from React Server Components. Without this, RSC errors only show up
// in the server logs, not in Sentry.
export const onRequestError = async (
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: string; routePath: string; routeType: string }
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
