-- ============================================================
-- RLS fixes from the beta-readiness audit
-- ============================================================
--
-- 1. Add INSERT policy on lead_pitches so the pitch API can actually
--    cache generated pitches. Without this, the insert was silently
--    failing (error swallowed in the route), which meant:
--      - Quota check always saw count=0 → unlimited AI pitches
--      - Every page load regenerated the same pitch → Anthropic cost leak
--    Ownership is enforced via join to businesses → scrape_jobs.
--
-- 2. Drop the outcome_stats view. It's not used anywhere in the app and
--    was created without security_invoker, which in Postgres 15+ means
--    it runs as the view owner and bypasses RLS. If anything ever
--    queried it, it would leak all users' pipeline stats. Drop it.
--
-- 3. Add DELETE policy on scrape_jobs so users can clean up their own
--    Recent Activity. Before this the table grew forever with no way
--    for users to prune it.
-- ============================================================

-- ----- lead_pitches INSERT policy -----
-- Users can insert a cached pitch only for businesses belonging to their
-- own scrape jobs. Two-level join (pitches → businesses → scrape_jobs).
CREATE POLICY "Users can create own pitches"
  ON public.lead_pitches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses
      JOIN public.scrape_jobs ON scrape_jobs.id = businesses.job_id
      WHERE businesses.id = lead_pitches.business_id
        AND scrape_jobs.user_id = auth.uid()
    )
  );

-- ----- Drop unused outcome_stats view -----
DROP VIEW IF EXISTS public.outcome_stats;

-- ----- scrape_jobs DELETE policy -----
CREATE POLICY "Users can delete own jobs"
  ON public.scrape_jobs FOR DELETE
  USING (auth.uid() = user_id);
