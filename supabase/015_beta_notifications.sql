-- ============================================================
-- Beta expiration notification tracking
-- ============================================================
--
-- Adds three flags to profiles so the daily cron that warns beta
-- users about their upcoming expiration doesn't re-send the same
-- email on every run.
--
-- The flags are reset back to false by grant_beta_access, so a user
-- who gets re-granted mid-cycle or after an expired grant will go
-- through the warning sequence again.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS beta_notified_7d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS beta_notified_1d boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS beta_notified_expired boolean NOT NULL DEFAULT false;

-- Re-declare grant_beta_access to reset the notification flags on
-- every grant. This is the only behavioral change from migration 012.
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
      searches_used = 0,
      searches_reset_at = now() + interval '30 days',
      pitches_used = 0,
      pitches_reset_at = now() + interval '30 days',
      beta_notified_7d = false,
      beta_notified_1d = false,
      beta_notified_expired = false
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
