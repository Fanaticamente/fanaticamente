-- Add club_id column to football_news to track which club page the news came from
ALTER TABLE public.football_news 
ADD COLUMN IF NOT EXISTS club_id TEXT DEFAULT NULL;

-- Create index for faster filtering by club
CREATE INDEX IF NOT EXISTS idx_football_news_club_id ON public.football_news(club_id);

-- Add comment for documentation
COMMENT ON COLUMN public.football_news.club_id IS 'ID of the club this news was scraped from (null for general news)';