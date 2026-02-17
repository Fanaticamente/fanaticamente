
-- Table for daily emotion entries
CREATE TABLE public.emotion_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  emotion TEXT NOT NULL,
  note TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

ALTER TABLE public.emotion_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emotion entries"
  ON public.emotion_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotion entries"
  ON public.emotion_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emotion entries"
  ON public.emotion_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- Table for upcoming matches (populated by admin or scraper)
CREATE TABLE public.upcoming_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id TEXT NOT NULL,
  opponent TEXT NOT NULL,
  match_date DATE NOT NULL,
  match_time TEXT,
  competition TEXT,
  is_home BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.upcoming_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read upcoming matches"
  ON public.upcoming_matches FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage matches"
  ON public.upcoming_matches FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Table for user pre-match expectations
CREATE TABLE public.match_expectations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  match_id UUID NOT NULL REFERENCES public.upcoming_matches(id) ON DELETE CASCADE,
  confidence_level TEXT NOT NULL,
  pre_match_feeling TEXT,
  win_impact TEXT,
  loss_impact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE public.match_expectations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expectations"
  ON public.match_expectations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expectations"
  ON public.match_expectations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expectations"
  ON public.match_expectations FOR UPDATE
  USING (auth.uid() = user_id);
