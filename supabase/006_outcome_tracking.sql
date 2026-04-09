-- Expand saved_list_items status for full outcome tracking
ALTER TABLE public.saved_list_items
  DROP CONSTRAINT IF EXISTS saved_list_items_status_check;

ALTER TABLE public.saved_list_items
  ADD CONSTRAINT saved_list_items_status_check
  CHECK (status IN ('saved', 'contacted', 'replied', 'quoted', 'signed', 'lost'));

-- Add deal tracking columns
ALTER TABLE public.saved_list_items
  ADD COLUMN IF NOT EXISTS deal_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS quoted_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- Create a view for outcome analytics
CREATE OR REPLACE VIEW public.outcome_stats AS
SELECT
  sl.user_id,
  COUNT(*) FILTER (WHERE sli.status = 'contacted') AS contacted,
  COUNT(*) FILTER (WHERE sli.status = 'replied') AS replied,
  COUNT(*) FILTER (WHERE sli.status = 'quoted') AS quoted,
  COUNT(*) FILTER (WHERE sli.status = 'signed') AS signed,
  COUNT(*) FILTER (WHERE sli.status = 'lost') AS lost,
  COALESCE(SUM(sli.deal_amount) FILTER (WHERE sli.status = 'signed'), 0) AS total_revenue
FROM public.saved_list_items sli
JOIN public.saved_lists sl ON sl.id = sli.list_id
GROUP BY sl.user_id;
