-- ============================================================
-- User preference: email notification when a search completes
-- ============================================================
--
-- The worker sends an email to the user when a scrape job finishes so
-- they don't have to sit on the tab waiting for long searches. Users
-- can opt out by setting this column to false in Settings.
--
-- Defaults to true so existing users get notifications automatically.
-- The worker checks this before sending; no auth required since it runs
-- under the service role.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_on_complete boolean NOT NULL DEFAULT true;
