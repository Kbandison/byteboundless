# Sentry Setup Guide

ByteBoundless uses Sentry for error monitoring. The SDK is wired into the
code; this doc walks you through the one-time dashboard setup to make it
actually report errors.

Free tier: 5k errors + 10k performance events per month. More than enough
for beta.

## 1. Create the Sentry project

1. Go to https://sentry.io/signup/ (or log in if you already have an account)
2. Create a new project:
   - Platform: **Next.js**
   - Project name: `byteboundless-web`
   - Alert frequency: `On every new issue` (good default for beta)
3. On the "configure SDK" screen, skip the auto-install — we've already
   done it manually. Just grab these values:
   - **DSN** — looks like `https://abc123@o456.ingest.sentry.io/789`
   - **Organization slug** — from the URL (`sentry.io/organizations/<slug>/`)
   - **Project slug** — the name you just chose

## 2. Create an auth token (for source map upload)

1. Sentry dashboard → Settings → Developer Settings → **Auth Tokens**
2. Click **Create New Token**
3. Name: `ByteBoundless Vercel Deploy`
4. Scopes: check `project:releases` and `org:read`
5. Copy the token — shown only once

## 3. Set environment variables

### Local (`apps/web/.env.local`)

```
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
```

That's all you need for local dev. The client-side errors won't actually be
sent because `sentry.client.config.ts` has `enabled: process.env.NODE_ENV === "production"`,
but the DSN needs to be present to avoid warnings.

### Vercel production

Set all five of these in **Project Settings → Environment Variables** for
the `Production` environment:

```
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=byteboundless-web
SENTRY_AUTH_TOKEN=<the token from step 2>
```

**Why both `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN`:**
- `NEXT_PUBLIC_SENTRY_DSN` is used by the client-side bundle (ships to the
  browser — that's why it has the `NEXT_PUBLIC_` prefix)
- `SENTRY_DSN` is used by server-side and edge runtime code (stays on the
  server)
- Setting both covers every runtime Sentry runs in

**`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`:**
Only needed at build time for source map upload. Without them, Sentry still
captures errors but you'll see minified stack traces instead of original
source. Highly recommended for production.

### Vercel preview (optional)

Set `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN` on the Preview environment if
you want preview deployments to also report errors. Most people keep preview
silent to avoid noise, and only track production. Your call.

## 4. Verify it works

After deploying to production with the env vars set:

1. Temporarily add a crash button somewhere (or use the debug route below)
2. Click it
3. Check Sentry dashboard → Issues — the error should appear within seconds

### Quick debug route

The Sentry Next.js SDK ships with a test endpoint. Visit:

```
https://<your-production-url>/sentry-example-page
```

...and click the "Trigger a sample exception" button. The error appears in
Sentry within a few seconds.

If it works, the test endpoint can be deleted (or left in place as a
deliberate canary — your call).

## What Sentry captures

- **Client-side errors:** unhandled React errors, event handler throws,
  rejected promises, uncaught exceptions from `useEffect` / callbacks
- **Server-side errors:** unhandled exceptions in API routes, Server
  Components, server actions, the proxy middleware
- **React Server Component errors:** via the `onRequestError` hook in
  `instrumentation.ts`
- **Performance traces:** 10% sample rate — top slow queries, slow API
  routes, slow page loads
- **Release tracking:** every deploy gets a release tag from
  `VERCEL_GIT_COMMIT_SHA` so you can see "this error first appeared in
  commit abc123"

## What Sentry does NOT capture

- Console logs (unless you explicitly call `Sentry.captureMessage()`)
- User-facing toast errors (they're caught before bubbling up)
- Expected business-logic errors returned as 4xx responses

## Worker (scraper) monitoring

The worker is a separate Node.js process that runs on Railway and polls
Supabase for pending scrape jobs. It uses `@sentry/node` with its own DSN
since it's a different runtime from the Next.js web app.

### What the worker reports

- **Unhandled exceptions** via Node's `uncaughtException` / `unhandledRejection`
  handlers (auto-installed by Sentry's default integrations)
- **Job processing errors** — any exception in `processJob` is captured
  with tags for the job ID and extra context (query, location, options)
- **Orphan recovery errors** — failures updating stuck jobs on startup
- **Stale sweep warnings** — whenever the background sweep marks jobs as
  failed, Sentry gets a `warning`-level message so repeated stuck-job
  patterns become visible
- **Poll loop errors** — anything that escapes the main polling try/catch
- **Performance traces** — outbound HTTP calls (Google Maps, PSI,
  Supabase) via the default Node integrations at 10% sample rate

### Setting it up on Railway

1. Go to https://sentry.io → your organization → **Create a new project**
   - Platform: **Node.js**
   - Project name: `byteboundless-worker`
   - This gives you a separate DSN from the web project so you can filter
     errors by service
2. Copy the DSN (looks like `https://abc@sentry.io/789`)
3. Railway dashboard → your worker service → **Variables** → add:
   ```
   SENTRY_DSN=https://abc@sentry.io/789
   ```
   Optional:
   ```
   NODE_ENV=production
   ```
   Railway automatically sets `RAILWAY_GIT_COMMIT_SHA` if the service is
   linked to a git repo — the worker config picks that up as the release
   tag. If you deploy from Docker images or another mechanism, set
   `SENTRY_RELEASE` manually.
4. Redeploy. You'll see `[Worker] Sentry initialized` in the logs on
   startup, or `[Worker] Sentry DSN not set — error monitoring disabled`
   if the env var didn't take.

### Verifying the worker integration

The cleanest way to verify is to deliberately trigger a failure:

1. In the Supabase SQL editor, insert a scrape job with a nonsense query
   so the scraper blows up:
   ```sql
   insert into scrape_jobs (user_id, query, location, options)
   values (
     'YOUR-USER-ID-HERE',
     '<script>alert(1)</script>',
     'Nowhere, NX',
     '{"radius":"city","maxResults":5,"enrich":false}'::jsonb
   );
   ```
2. The worker picks it up, fails, writes an error to the job row, and
   reports the exception to Sentry with tags `context: process_job`,
   `job_id: <uuid>`, and extras including the query and location.
3. Check your `byteboundless-worker` Sentry project — the error should
   appear within seconds.

### Why a separate Sentry project (not shared with web)

You *can* use the same DSN for both the web app and the worker. But:
- Different runtimes emit different stack formats, and Sentry groups
  errors by stack signature. Mixing them makes grouping noisier.
- Alert rules are usually different — a web error is user-facing and
  urgent, a worker error is backend and can wait until business hours.
- Quotas count per project, so if the worker has a bad day it won't
  eat the web project's error budget.

If you only have the free tier (one project), share the DSN and add a
`service` tag in each init so you can filter:
```ts
// sentry.client.config.ts
Sentry.init({ dsn, initialScope: { tags: { service: "web" } } });
```
```ts
// worker/instrument.ts
Sentry.init({ dsn, initialScope: { tags: { service: "worker" } } });
```

## Filtering noise

The `ignoreErrors` list in `sentry.client.config.ts` already filters common
browser-extension / ResizeObserver / network-abort noise. Add to that list
whenever you see an error in Sentry that's not actionable.

For server-side filtering, add a `beforeSend` hook to
`sentry.server.config.ts`:

```ts
beforeSend(event, hint) {
  // Drop the noise pattern here
  if (hint?.originalException?.message?.includes("ENOENT")) return null;
  return event;
}
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| No errors showing in Sentry dashboard | Check `NEXT_PUBLIC_SENTRY_DSN` is set on Vercel production and the deployment used that env var (redeploy after setting) |
| Errors show up but stack traces are minified | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` missing — source maps not uploaded. Redeploy after setting. |
| "Failed to upload source maps" in build logs | The `errorHandler` in `next.config.ts` catches this so the build doesn't fail. Check the auth token has `project:releases` scope. |
| Sentry tunnelRoute `/monitoring` returning 404 | This is a Next.js rewrite, should work automatically via `withSentryConfig`. If it's 404ing, check the dev server console for middleware errors. |
| Dev errors not showing in Sentry | Intentional — `enabled: process.env.NODE_ENV === "production"` in all config files. Flip to `"development"` or remove entirely to get dev errors. |
