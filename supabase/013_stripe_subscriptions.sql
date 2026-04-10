-- ============================================================
-- Stripe subscriptions: idempotent webhook processing + sub tracking
-- ============================================================
--
-- Supports:
-- - Storing the active Stripe subscription ID on each profile so we can
--   look it up on lifecycle events and for the customer portal
-- - Idempotent webhook processing via a table of processed event IDs —
--   Stripe retries events on non-2xx responses, and without idempotency
--   a retry after partial processing would re-credit users or double
--   up plan changes.
-- ============================================================

-- ----- stripe_subscription_id on profiles -----
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- ----- Idempotency table for Stripe webhook events -----
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Locked down — only service role (used by the webhook) ever touches this
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- ----- Unique constraint on overage purchases -----
-- Second line of defense: even if webhook idempotency somehow fails,
-- we can't double-insert the same session.
CREATE UNIQUE INDEX IF NOT EXISTS idx_overage_purchases_session
  ON public.overage_purchases(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
