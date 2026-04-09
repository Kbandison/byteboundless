-- Overage credit tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS overage_credits integer NOT NULL DEFAULT 0;

-- Purchase history for audit trail
CREATE TABLE IF NOT EXISTS public.overage_purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits integer NOT NULL,
  amount_cents integer NOT NULL,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_overage_purchases_user ON public.overage_purchases(user_id);

ALTER TABLE public.overage_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchases"
  ON public.overage_purchases FOR SELECT
  USING (auth.uid() = user_id);
