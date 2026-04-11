-- ============================================================
-- Live activity string for in-progress searches
-- ============================================================
--
-- The worker writes a short string here describing what it's
-- currently doing — e.g. "Visiting Joe's Plumbing in Irvine".
-- The search progress page subscribes via Supabase realtime and
-- shows it in a typewriter-style ticker so the user can see the
-- scraper actually working in real time, not just a progress bar.
--
-- The string is overwritten every time the scraper moves on to
-- the next business (throttled through the same flush window as
-- progress_current/progress_total updates), so it's a "what's
-- happening NOW" channel, not a history feed.
-- ============================================================

ALTER TABLE public.scrape_jobs
  ADD COLUMN IF NOT EXISTS current_activity text;
