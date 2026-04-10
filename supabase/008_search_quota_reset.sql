-- ============================================================
-- Search quota rolling 30-day reset + atomic consumption
-- ============================================================
--
-- Fixes two issues with the original search-limit implementation:
--
-- 1. `searches_used` was only ever incremented — it never reset. A free
--    user who hit 3 searches was blocked forever.
--
-- 2. The original flow was read-then-update in the API route, which is a
--    TOCTOU race: two parallel requests could both read the current count,
--    both pass the limit check, and both increment, letting the user exceed
--    their quota.
--
-- This migration:
-- - Adds `searches_reset_at timestamptz` to profiles
-- - Backfills existing rows so everyone gets a fresh 30-day window starting now
-- - Updates handle_new_user() to set `searches_reset_at` on signup
-- - Adds a `consume_search_quota(uuid)` RPC that locks the row, resets if
--   the window has elapsed, and atomically increments the counter (or
--   deducts an overage credit). Returns a status string the API route uses
--   to decide whether to proceed or return 403.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS searches_reset_at timestamptz;

-- Backfill: every existing user gets a fresh 30-day window starting now.
-- This is kinder than prorating based on created_at — it gives existing
-- users a clean slate when this migration runs.
UPDATE public.profiles
  SET searches_reset_at = now() + interval '30 days'
  WHERE searches_reset_at IS NULL;

-- Going forward, the column is non-null for new rows
ALTER TABLE public.profiles
  ALTER COLUMN searches_reset_at SET DEFAULT (now() + interval '30 days'),
  ALTER COLUMN searches_reset_at SET NOT NULL;

-- Update the signup trigger so new users get a 30-day window from signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, searches_reset_at)
  VALUES (new.id, new.email, now() + interval '30 days');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- consume_search_quota
-- ============================================================
-- Atomic quota check + consumption. Called from the search API before
-- creating a scrape job. Returns one of:
--
--   'ok'          — under the limit, counter incremented
--   'ok_overage'  — at the limit but had overage credit, credit deducted
--   'free_limit'  — free user at their 3/month cap, nothing deducted
--   'paid_limit'  — paid user at cap with no overage, nothing deducted
--   'not_found'   — no profile row (shouldn't happen, defensive)
--
-- Row is locked FOR UPDATE for the duration so concurrent calls serialize.
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_search_quota(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_profile record;
  v_limit int;
  v_plan_limits constant jsonb := '{"free": 3, "pro": 50, "agency": 200}'::jsonb;
BEGIN
  -- Lock the profile row for the duration of this transaction
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- Reset the counter if the 30-day window has elapsed. Advance the window
  -- by exactly 30 days from now (rolling), not from the old reset date —
  -- this keeps the window predictable for users who come back after a break.
  IF v_profile.searches_reset_at IS NULL OR now() > v_profile.searches_reset_at THEN
    UPDATE public.profiles
    SET searches_used = 0,
        searches_reset_at = now() + interval '30 days'
    WHERE id = p_user_id;
    v_profile.searches_used := 0;
  END IF;

  -- Look up the plan limit
  v_limit := COALESCE((v_plan_limits ->> v_profile.plan)::int, 3);

  -- Under the limit: increment and allow
  IF v_profile.searches_used < v_limit THEN
    UPDATE public.profiles
    SET searches_used = searches_used + 1
    WHERE id = p_user_id;
    RETURN 'ok';
  END IF;

  -- At the limit: try overage credits (paid plans only)
  IF v_profile.plan <> 'free' AND COALESCE(v_profile.overage_credits, 0) > 0 THEN
    UPDATE public.profiles
    SET overage_credits = overage_credits - 1
    WHERE id = p_user_id;
    RETURN 'ok_overage';
  END IF;

  -- Out of quota
  IF v_profile.plan = 'free' THEN
    RETURN 'free_limit';
  END IF;
  RETURN 'paid_limit';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
