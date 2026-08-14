ALTER TABLE public.football_news ADD COLUMN IF NOT EXISTS club_ids text[] NOT NULL DEFAULT '{}';
UPDATE public.football_news SET club_ids = ARRAY[club_id] WHERE club_id IS NOT NULL AND (club_ids IS NULL OR cardinality(club_ids) = 0);
CREATE INDEX IF NOT EXISTS football_news_club_ids_idx ON public.football_news USING GIN (club_ids);