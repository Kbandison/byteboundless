# Notifications

Outbound email notifications ByteBoundless sends to users from the worker
service. Separate from the Supabase auth emails (magic link, signup
confirmation) documented in `supabase/email-templates/README.md` — those
are inbound Supabase→user, this doc is outbound worker→user.

## Current notifications

| Event | Channel | Opt-out |
|---|---|---|
| Search / enrichment job completed | Email (Resend) | `profiles.notify_on_complete` (default `true`) |

More will be added here as we ship them.

## Search-complete email

### What users get

When a scrape job (Google Maps search OR URL import) finishes successfully
with at least one result, the worker sends the user a styled HTML email
with:

- The search query and location (or "Your enrichment is ready" for URL imports)
- Total result count
- Hot lead count (score ≥ 80)
- Big "View Results" button linking to `/search/<jobId>/results`
- A short encouragement line ("N of your leads scored 80+ — start there")
- Footer with a "Manage notifications" link back to `/settings#notifications`

### When it's skipped

The worker silently does NOT send the email when:

- The user's `notify_on_complete` is `false` (opted out in Settings)
- The job has zero results (not worth notifying)
- `RESEND_API_KEY` env var is missing (graceful no-op)
- The recipient profile has no email (shouldn't happen, defensive)

Failures to send (Resend API error, network issue, domain not verified
yet, etc.) are captured to Sentry as `warning`-level messages but never
fail the job itself — users still see results in-app regardless of
email state.

### Required env vars (worker / Railway)

Set these on the Railway worker service:

```
RESEND_API_KEY=re_...       # Same Resend account used for Supabase SMTP
APP_URL=https://byteboundless.io       # Base URL for the "View Results" link
RESEND_FROM_ADDRESS=ByteBoundless <hello@byteboundless.io>  # Optional, has a default
```

**Prerequisites:**
- Your Resend domain must be verified with SPF/DKIM before this will
  actually deliver. See `supabase/email-templates/README.md` step 3b
  for the one-time domain setup.
- If the Resend setup isn't done yet, the worker will still try to send
  and the attempt will fail (logged + Sentry captured) but the job
  completes normally.

### Per-user opt-out

Users can turn off search-complete emails from **Settings → Notifications**.
The toggle updates `profiles.notify_on_complete` atomically. The worker
re-reads the flag on every job completion, so toggling off takes effect
immediately.

The toggle defaults to `true` for everyone — new signups get notifications
unless they explicitly disable them. Existing users from before the
migration also default to `true` via the column default.

### Testing it

Without touching production:

1. Make sure the worker has `RESEND_API_KEY` and `APP_URL` set
2. Run a search with your own account through the app (keep it small:
   5-10 results, no enrichment if you want speed)
3. Wait ~30 seconds for the scrape to finish
4. Check the inbox of the email tied to your account
5. Verify:
   - [ ] Email arrived within 60 seconds of the search completing
   - [ ] Stats match (result count, hot lead count)
   - [ ] "View Results" button links to the correct `/search/<jobId>/results`
   - [ ] Clicking through works and shows the actual results
   - [ ] Footer "Manage notifications" goes to Settings
6. Toggle off in Settings, run another search, confirm no email arrives
7. Toggle back on, run another, confirm it does

### Design notes

- **Why from the worker, not the web app?**
  The worker is the single source of truth for job completion — it writes
  `status = 'completed'` to the DB. Sending from anywhere else risks race
  conditions or sends that fire before the user can actually view the
  results. The worker already has the full job context at the moment of
  completion, so it's the cleanest spot.

- **Why fetch, not the Resend SDK?**
  Keeping the worker Docker image small. Resend's HTTP API is simple
  enough that the ~200KB SDK isn't worth pulling in.

- **Why skip zero-result searches?**
  Nothing is more annoying than an email that says "your search is
  ready!" followed by "0 results." We let the in-app empty state handle
  that case and keep email for wins.

- **Why not send for failed jobs too?**
  Partially because failures are rare after task #78's worker resilience
  fixes, partially because "your job failed" is a worse beta experience
  than simply not getting an email. When we ship better error messaging
  from the worker, we can revisit. For now, failed jobs are visible in
  the dashboard's Recent Activity list.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Job completes but no email arrives | `RESEND_API_KEY` not set on worker | Add it to Railway env and redeploy |
| Email lands in spam | Domain not verified or DKIM missing | Complete `supabase/email-templates/README.md` step 3b |
| "View Results" button goes to wrong URL | `APP_URL` missing or wrong | Set it to your production URL on Railway |
| Subject says `undefined in undefined` | Job metadata corrupted | Check the scrape_jobs row for that job — shouldn't happen in practice |
| Email sent even though I toggled off | Cached profile read before opt-out, or toggle didn't save | Check Settings → Notifications again; toggle is optimistic so failed saves revert |

## Future notifications (not built yet)

Possible additions we might ship later:

- **Weekly digest** — summary of searches + leads + pipeline movement
- **Stale lead nudge** — "you have 5 contacted leads you haven't followed up on"
- **Subscription lifecycle** — "your trial ends in 3 days", "payment failed", "subscription renewed"
- **Beta access expiration warning** — "your beta access expires in 5 days"

When any of these land, add a section above and a row in the opening
Current Notifications table.
