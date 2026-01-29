-- Add column to track if article was rewritten by AI or is original content
ALTER TABLE public.football_news 
ADD COLUMN IF NOT EXISTS is_original boolean DEFAULT false;