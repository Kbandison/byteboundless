-- ============================================================
-- Global API budget ceiling (defense in depth for AI costs)
-- ============================================================
--
-- Per-user pitch quotas already exist (consume_pitch_quota) — this
-- is a separate, site-wide daily ceiling that protects against:
--   - A bug in consume_pitch_quota that lets individual quotas
--     silently over-spend
--   - A compromised admin account running up bills
--   - A runaway background process
--
-- One row per day, incremented atomically via RPC. The route
-- checks the return value and 503s if the day is over budget.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.api_usage (
  kind text NOT NULL,
  day date NOT NULL,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, day)
);

-- Only the service role touches this table — end users never see
-- their own row. Locking down with RLS prevents a bug or injection
-- from exposing usage patterns.
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage_deny_all" ON public.api_usage
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- consume_api_budget(kind, limit)
-- ============================================================
-- Atomically increments today's counter for the given kind. Returns
-- the new count. Caller compares the count to their limit and
-- decides whether to proceed (if count <= limit) or reject.
--
-- Runs as SECURITY DEFINER so end users can call it despite the
-- deny-all RLS. The function itself is gated to "authenticated"
-- role because anonymous visitors don't hit the quota'd APIs.
-- ============================================================
CREATE OR REPLACE FUNCTION public.consume_api_budget(
  p_kind text,
  p_limit int
) RETURNS int AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO public.api_usage (kind, day, count)
  VALUES (p_kind, current_date, 1)
  ON CONFLICT (kind, day)
  DO UPDATE SET count = public.api_usage.count + 1
  RETURNING count INTO v_count;

  -- Return the post-increment count. If it's over the limit, the
  -- caller rejects the request — the row stays incremented so
  -- repeat attempts still count against the budget (prevents a
  -- race where an attacker hammers the endpoint to deplete
  -- increments before we reject).
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.consume_api_budget(text, int) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_api_budget(text, int) TO authenticated;
