-- Create app_pages table to manage system pages visibility
CREATE TABLE public.app_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  icon TEXT DEFAULT 'file-text',
  description TEXT,
  is_visible BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  platform TEXT DEFAULT 'both',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_pages ENABLE ROW LEVEL SECURITY;

-- Allow public read access for pages visibility check
CREATE POLICY "Public can view page visibility" 
ON public.app_pages 
FOR SELECT 
USING (true);

-- Only developers can modify pages (correct parameter order: user_id, role)
CREATE POLICY "Developers can modify pages" 
ON public.app_pages 
FOR ALL 
USING (public.has_role(auth.uid(), 'developer'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_pages;

-- Insert default pages
INSERT INTO public.app_pages (page_id, name, path, icon, description, is_visible, is_public, platform, order_index) VALUES
  ('home', 'Página Inicial', '/', 'home', 'Página principal do app', true, true, 'both', 0),
  ('terapeutas', 'Terapeutas', '/terapeutas', 'users', 'Marketplace de terapeutas', true, true, 'both', 1),
  ('cursos', 'FanatiClass', '/cursos', 'graduation-cap', 'Cursos e treinamentos', true, true, 'both', 2),
  ('quiz', 'Quiz Emocional', '/quiz', 'brain', 'Termômetro emocional', true, true, 'both', 3),
  ('radio', 'Rádio Fanática', '/radio', 'radio', 'Rádio online', true, true, 'both', 4),
  ('futebol', 'Futebol', '/futebol', 'trophy', 'Notícias de futebol', true, true, 'both', 5),
  ('loja', 'FanaticaShop', '/loja', 'shopping-bag', 'Loja virtual', true, true, 'both', 6),
  ('osmf', 'OSMF', '/osmf', 'heart', 'Ouvidoria de Saúde Mental', true, true, 'both', 7),
  ('zona-mista', 'Zona Mista', '/zona-mista', 'newspaper', 'Blog de notícias', true, true, 'desktop', 8),
  ('diario', 'Diário', '/diario', 'book', 'Diário pessoal', true, false, 'mobile', 9),
  ('perfil', 'Perfil', '/perfil', 'user', 'Perfil do usuário', true, false, 'both', 10),
  ('meus-agendamentos', 'Meus Agendamentos', '/meus-agendamentos', 'calendar', 'Agendamentos do usuário', true, false, 'both', 11)
ON CONFLICT (page_id) DO NOTHING;