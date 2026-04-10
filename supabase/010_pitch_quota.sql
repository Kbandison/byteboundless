-- ============================================================
-- Pitch quota: rolling 30-day reset + atomic consumption
-- ============================================================
--
-- Mirrors the search quota pattern (migration 008). Fixes three issues
-- with the original pitch-limit implementation:
--
-- 1. The count query that enforced the limit relied on RLS scoping and
--    had no explicit user filter — fragile and easy to accidentally
--    break with future schema changes.
-- 2. It counted from the start of the calendar month instead of a
--    rolling 30-day window, inconsistent with the search quota.
-- 3. Before migration 009 added the INSERT policy, pitches were never
--    cached, which meant the count query always returned 0 and the
--    limit was never actually enforced. A free user could generate
--    unlimited AI pitches, burning Anthropic budget with no cap.
--
-- After this migration the pitch quota is:
-- - Tracked on profiles as pitches_used + pitches_reset_at
-- - Consumed atomically via consume_pitch_quota() RPC (row-locked)
-- - Reset on a rolling 30-day window, same as searches
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pitches_used integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pitches_reset_at timestamptz;

-- Backfill existing users with a fresh 30-day window starting now
UPDATE public.profiles
  SET pitches_reset_at = now() + interval '30 days'
  WHERE pitches_reset_at IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN pitches_reset_at SET DEFAULT (now() + interval '30 days'),
  ALTER COLUMN pitches_reset_at SET NOT NULL;

-- Keep handle_new_user() in sync so new signups get both reset windows
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, searches_reset_at, pitches_reset_at)
  VALUES (
    new.id,
    new.email,
    now() + interval '30 days',
    now() + interval '30 days'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- consume_pitch_quota
-- ============================================================
-- Same contract as consume_search_quota. Returns one of:
--   'ok'         — under the limit, counter incremented
--   'free_limit' — free user at their 10/month cap
--   'paid_limit' — paid user at cap (pro 200, agency 999999)
--   'not_found'  — no profile row
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_pitch_quota(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_profile record;
  v_limit int;
  v_plan_limits constant jsonb := '{"free": 10, "pro": 200, "agency": 999999}'::jsonb;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- Reset the counter if the 30-day window has elapsed
  IF v_profile.pitches_reset_at IS NULL OR now() > v_profile.pitches_reset_at THEN
    UPDATE public.profiles
    SET pitches_used = 0,
        pitches_reset_at = now() + interval '30 days'
    WHERE id = p_user_id;
    v_profile.pitches_used := 0;
  END IF;

  -- Look up the plan limit
  v_limit := COALESCE((v_plan_limits ->> v_profile.plan)::int, 10);

  -- Under the limit: increment and allow
  IF v_profile.pitches_used < v_limit THEN
    UPDATE public.profiles
    SET pitches_used = pitches_used + 1
    WHERE id = p_user_id;
    RETURN 'ok';
  END IF;

  -- At the limit
  IF v_profile.plan = 'free' THEN
    RETURN 'free_limit';
  END IF;
  RETURN 'paid_limit';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
