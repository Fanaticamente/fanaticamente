CREATE TABLE public.health_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  image_caption TEXT,
  image_credits TEXT,
  category TEXT NOT NULL DEFAULT 'Saúde e Bem-estar',
  author_name TEXT,
  author_id UUID,
  is_featured_home BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_news_published ON public.health_news(is_published, published_at DESC);
CREATE INDEX idx_health_news_featured ON public.health_news(is_featured_home) WHERE is_featured_home = true;

ALTER TABLE public.health_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published health news"
  ON public.health_news FOR SELECT
  USING (is_published = true OR has_role(auth.uid(), 'marketing'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Content managers can insert health news"
  ON public.health_news FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'marketing'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Content managers can update health news"
  ON public.health_news FOR UPDATE
  USING (has_role(auth.uid(), 'marketing'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Content managers can delete health news"
  ON public.health_news FOR DELETE
  USING (has_role(auth.uid(), 'marketing'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

CREATE TRIGGER update_health_news_updated_at
  BEFORE UPDATE ON public.health_news
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.health_news;

-- Storage bucket for health news images
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-news', 'health-news', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read health-news images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'health-news');

CREATE POLICY "Content managers upload health-news images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'health-news' AND (
      has_role(auth.uid(), 'marketing'::app_role) OR
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'developer'::app_role)
    )
  );

CREATE POLICY "Content managers update health-news images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'health-news' AND (
      has_role(auth.uid(), 'marketing'::app_role) OR
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'developer'::app_role)
    )
  );

CREATE POLICY "Content managers delete health-news images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'health-news' AND (
      has_role(auth.uid(), 'marketing'::app_role) OR
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'developer'::app_role)
    )
  );