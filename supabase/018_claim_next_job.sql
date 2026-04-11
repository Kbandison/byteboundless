-- ============================================================
-- Atomic concurrent job claiming with per-user fairness
-- ============================================================
--
-- The worker is moving from single-job polling to N concurrent
-- worker loops. Each loop calls this function to atomically claim
-- the next job, with two key properties:
--
-- 1. Concurrency-safe: FOR UPDATE SKIP LOCKED ensures two workers
--    never claim the same job. Other rows in flight are skipped
--    instead of blocking.
--
-- 2. Per-user fairness: prefers pending jobs from users who don't
--    already have a running job. This prevents one user submitting
--    five searches at once from hogging all the worker slots while
--    other users wait. Falls back to any pending job if every user
--    with work queued already has something running (otherwise we'd
--    starve when one user is the only one with pending jobs).
--
-- The function returns the claimed row if there's work to do, or
-- nothing if the queue is empty. The worker treats an empty result
-- as "sleep and try again."
-- ============================================================

CREATE OR REPLACE FUNCTION public.claim_next_job()
RETURNS SETOF public.scrape_jobs AS $$
BEGIN
  -- Fairness pass: prefer pending jobs from users with no running job.
  RETURN QUERY
  WITH next_fair_job AS (
    SELECT id FROM public.scrape_jobs
    WHERE status = 'pending'
      AND user_id NOT IN (
        SELECT user_id FROM public.scrape_jobs WHERE status = 'running'
      )
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.scrape_jobs
  SET status = 'running',
      phase = 'collecting',
      heartbeat_at = now()
  FROM next_fair_job
  WHERE public.scrape_jobs.id = next_fair_job.id
  RETURNING public.scrape_jobs.*;

  -- If the fairness pass returned anything, we're done.
  IF FOUND THEN
    RETURN;
  END IF;

  -- Fallback: claim any pending job. This kicks in when every user
  -- with pending work already has a running job — typically when one
  -- power user has queued multiple searches and there's no one else
  -- in the queue to share with.
  RETURN QUERY
  WITH next_any_job AS (
    SELECT id FROM public.scrape_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.scrape_jobs
  SET status = 'running',
      phase = 'collecting',
      heartbeat_at = now()
  FROM next_any_job
  WHERE public.scrape_jobs.id = next_any_job.id
  RETURNING public.scrape_jobs.*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lock down execution: only the service role (which the worker uses)
-- can call this. End users have no business claiming jobs.
REVOKE ALL ON FUNCTION public.claim_next_job() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_next_job() TO service_role;
