-- ============================================================
-- Worker heartbeat + stale-job recovery
-- ============================================================
--
-- Fixes orphaned-job scenarios where the worker claims a job, starts
-- processing, and then dies (OOM kill, container restart, silent hang).
-- Before this change, those jobs would sit in 'running' forever because
-- the worker only picks up 'pending' jobs on startup.
--
-- Pattern:
-- - Every progress update stamps heartbeat_at = now() on the row
-- - On worker startup, any 'running' job with a stale heartbeat (> 10 min)
--   gets reset to 'pending' so it can be re-claimed
-- - During normal polling, any 'running' job with a heartbeat older than
--   15 min gets marked 'failed' with a timeout error (catches silent hangs
--   where the worker is alive but the Playwright browser is stuck)
-- ============================================================

ALTER TABLE public.scrape_jobs
  ADD COLUMN IF NOT EXISTS heartbeat_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_heartbeat
  ON public.scrape_jobs(heartbeat_at)
  WHERE status = 'running';
