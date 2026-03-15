
CREATE TABLE public.emotional_lineups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  formation text NOT NULL,
  lineup jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_analysis text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

ALTER TABLE public.emotional_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lineups"
  ON public.emotional_lineups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lineups"
  ON public.emotional_lineups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lineups"
  ON public.emotional_lineups FOR UPDATE
  USING (auth.uid() = user_id);
