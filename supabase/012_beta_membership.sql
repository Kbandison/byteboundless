-- ============================================================
-- Beta membership + admin unlimited access + plan expiration
-- ============================================================
--
-- For the closed beta we want to grant individual users full access
-- (equivalent to Agency plan) for 30 days at a time, without charging
-- them. Admins bypass all quota enforcement entirely.
--
-- Mechanism:
-- - New column `plan_expires_at timestamptz` (nullable, null = permanent)
-- - `grant_beta_access(uuid, int)` RPC sets plan='agency' + expires_at
-- - `revoke_beta_access(uuid)` RPC reverts to free
-- - Both quota RPCs short-circuit to 'ok' for admins
-- - Both quota RPCs check plan_expires_at and auto-revert to free when expired
--
-- This lets us manually grant beta membership from the admin panel and
-- have it auto-expire 30 days later with no cron needed.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;

-- ============================================================
-- grant_beta_access
-- ============================================================
-- Admin-only: upgrade a user to Agency-tier access for p_days days.
-- Resets their usage counters so they get a fresh allowance from the
-- moment the grant happens (not their original signup date).
-- ============================================================
CREATE OR REPLACE FUNCTION public.grant_beta_access(
  p_user_id uuid,
  p_days int DEFAULT 30
) RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can grant beta access';
  END IF;

  IF p_days <= 0 OR p_days > 365 THEN
    RAISE EXCEPTION 'p_days must be between 1 and 365';
  END IF;

  UPDATE public.profiles
  SET plan = 'agency',
      plan_expires_at = now() + (p_days || ' days')::interval,
      -- Give them a fresh quota window too
      searches_used = 0,
      searches_reset_at = now() + interval '30 days',
      pitches_used = 0,
      pitches_reset_at = now() + interval '30 days'
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- revoke_beta_access
-- ============================================================
-- Admin-only: revert a beta user to the free plan immediately.
-- Does not touch searches_used / pitches_used — they keep whatever
-- they accumulated during beta and wait for the normal 30-day reset.
-- ============================================================
CREATE OR REPLACE FUNCTION public.revoke_beta_access(p_user_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can revoke beta access';
  END IF;

  UPDATE public.profiles
  SET plan = 'free',
      plan_expires_at = NULL
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- consume_search_quota (updated)
-- ============================================================
-- Changes from 008:
-- - Admins bypass all quota enforcement (return 'ok' immediately)
-- - Plan auto-reverts to free when plan_expires_at is past
-- - Expiration happens BEFORE the quota lookup so a just-expired beta
--   user hits the free-tier cap on their next search
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_search_quota(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_profile record;
  v_limit int;
  v_plan_limits constant jsonb := '{"free": 3, "pro": 50, "agency": 200}'::jsonb;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- Admins bypass all quota enforcement
  IF v_profile.role = 'admin' THEN
    RETURN 'ok';
  END IF;

  -- Expire beta / trial access that's past its deadline
  IF v_profile.plan_expires_at IS NOT NULL AND now() > v_profile.plan_expires_at THEN
    UPDATE public.profiles
    SET plan = 'free',
        plan_expires_at = NULL
    WHERE id = p_user_id;
    v_profile.plan := 'free';
  END IF;

  -- Reset the counter if the 30-day window has elapsed
  IF v_profile.searches_reset_at IS NULL OR now() > v_profile.searches_reset_at THEN
    UPDATE public.profiles
    SET searches_used = 0,
        searches_reset_at = now() + interval '30 days'
    WHERE id = p_user_id;
    v_profile.searches_used := 0;
  END IF;

  v_limit := COALESCE((v_plan_limits ->> v_profile.plan)::int, 3);

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

  IF v_profile.plan = 'free' THEN
    RETURN 'free_limit';
  END IF;
  RETURN 'paid_limit';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- consume_pitch_quota (updated)
-- ============================================================
-- Same changes as consume_search_quota.
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

  -- Admins bypass all quota enforcement
  IF v_profile.role = 'admin' THEN
    RETURN 'ok';
  END IF;

  -- Expire beta / trial access
  IF v_profile.plan_expires_at IS NOT NULL AND now() > v_profile.plan_expires_at THEN
    UPDATE public.profiles
    SET plan = 'free',
        plan_expires_at = NULL
    WHERE id = p_user_id;
    v_profile.plan := 'free';
  END IF;

  -- Reset the counter if the 30-day window has elapsed
  IF v_profile.pitches_reset_at IS NULL OR now() > v_profile.pitches_reset_at THEN
    UPDATE public.profiles
    SET pitches_used = 0,
        pitches_reset_at = now() + interval '30 days'
    WHERE id = p_user_id;
    v_profile.pitches_used := 0;
  END IF;

  v_limit := COALESCE((v_plan_limits ->> v_profile.plan)::int, 10);

  IF v_profile.pitches_used < v_limit THEN
    UPDATE public.profiles
    SET pitches_used = pitches_used + 1
    WHERE id = p_user_id;
    RETURN 'ok';
  END IF;

  IF v_profile.plan = 'free' THEN
    RETURN 'free_limit';
  END IF;
  RETURN 'paid_limit';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
