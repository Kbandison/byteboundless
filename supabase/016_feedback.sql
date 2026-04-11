-- ============================================================
-- Feedback / support inbox
-- ============================================================
--
-- Users submit feedback through an in-app form. Each submission:
--   - Creates a row here
--   - Emails support@byteboundless.io so an admin sees it live
--   - Emails the submitter a confirmation receipt
--
-- The user-facing /feedback page lists their own submissions with
-- a status chip so they can track resolution. Admins see everything
-- at /admin/feedback and can flip the status as they work through
-- the queue.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  category text NOT NULL CHECK (category IN ('bug', 'feature', 'question', 'other')),
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON public.feedback (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON public.feedback (status, created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback rows.
CREATE POLICY "feedback_insert_self" ON public.feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback rows. Admins bypass this via
-- the separate admin policy below.
CREATE POLICY "feedback_select_self" ON public.feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins read everything.
CREATE POLICY "feedback_select_admin" ON public.feedback
  FOR SELECT
  USING (public.is_admin());

-- Admins update status (and only status — column-level restriction
-- isn't practical via RLS, but the admin API route only writes the
-- status field anyway).
CREATE POLICY "feedback_update_admin" ON public.feedback
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
