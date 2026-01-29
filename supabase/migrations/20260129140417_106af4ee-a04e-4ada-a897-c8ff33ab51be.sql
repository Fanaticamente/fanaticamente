-- Create table for scraped and rewritten news
CREATE TABLE public.football_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT NOT NULL UNIQUE,
  source_site TEXT NOT NULL,
  original_title TEXT NOT NULL,
  rewritten_title TEXT NOT NULL,
  original_content TEXT,
  rewritten_content TEXT NOT NULL,
  image_url TEXT,
  image_caption TEXT,
  image_credits TEXT,
  category TEXT DEFAULT 'Futebol',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.football_news ENABLE ROW LEVEL SECURITY;

-- Allow public read access (news are public)
CREATE POLICY "Anyone can read football news" 
ON public.football_news 
FOR SELECT 
USING (true);

-- Only service role can insert/update (edge functions)
CREATE POLICY "Service role can manage news" 
ON public.football_news 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create index for faster queries
CREATE INDEX idx_football_news_published_at ON public.football_news(published_at DESC);
CREATE INDEX idx_football_news_category ON public.football_news(category);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.football_news;