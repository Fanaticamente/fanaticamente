-- Create app_modules table for storing module configurations
CREATE TABLE public.app_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT NOT NULL UNIQUE,
  module_type TEXT NOT NULL DEFAULT 'section',
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'layout',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  page TEXT NOT NULL DEFAULT 'home',
  parent_id TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.app_modules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view modules" 
ON public.app_modules 
FOR SELECT 
USING (true);

CREATE POLICY "Developers can manage modules" 
ON public.app_modules 
FOR ALL 
USING (has_role(auth.uid(), 'developer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_modules_updated_at
BEFORE UPDATE ON public.app_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial modules for home page
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config) VALUES
('hero_carousel', 'carousel', 'Carrossel Principal', 'Banner rotativo no topo da página', 'image', true, 1, 'home', '{"slides": [{"image": "/hero-slide-1.jpg", "title": "Vista a Camisa", "subtitle": "Faça terapia"}, {"image": "/hero-slide-2.jpg", "title": "Futebol", "subtitle": "Pense nele"}]}'),
('tunnel_access', 'card', 'Túnel de Acesso', 'Card para encontrar terapeuta', 'users', true, 2, 'home', '{"title": "Encontre um Terapeuta", "image": "/tunnel-bg.jpg", "link": "/terapeutas"}'),
('ticket_card', 'card', 'Ingresso Consciência', 'Card de cursos e ingressos', 'ticket', true, 3, 'home', '{"title": "Seu Ingresso", "link": "/cursos"}'),
('quiz_card', 'card', 'Quiz Emocional', 'Card do termômetro emocional', 'brain', true, 4, 'home', '{"title": "Quiz", "link": "/quiz"}'),
('radio_card', 'card', 'Rádio Fanática', 'Card de rádio/podcast', 'radio', true, 5, 'home', '{"title": "Rádio", "link": "/radio"}'),
('fanaticlass_card', 'card', 'FanatiClass', 'Card de cursos educativos', 'graduation-cap', true, 6, 'home', '{"title": "FanatiClass", "link": "/cursos"}');

-- Insert navigation modules
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config) VALUES
('bottom_nav', 'navigation', 'Navegação Inferior', 'Menu de navegação principal', 'navigation', true, 1, 'navigation', '{"items": [{"icon": "home", "label": "Home", "path": "/"}, {"icon": "brain", "label": "Termômetro", "path": "/quiz"}, {"icon": "trophy", "label": "Futebol", "path": "/futebol"}, {"icon": "user", "label": "Login", "path": "/auth"}]}'),
('header', 'navigation', 'Cabeçalho', 'Header do aplicativo', 'layout', true, 2, 'navigation', '{"logo": "/logo-header.png", "showMenu": true}');

-- Insert page modules
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config) VALUES
('therapists_page', 'page', 'Terapeutas', 'Página de listagem de terapeutas', 'users', true, 1, 'pages', '{"title": "Encontre um Terapeuta", "path": "/terapeutas"}'),
('shop_page', 'page', 'Loja', 'Página da loja de produtos', 'shopping-bag', true, 2, 'pages', '{"title": "Loja Fanática", "path": "/loja"}'),
('quiz_page', 'page', 'Quiz', 'Termômetro emocional', 'brain', true, 3, 'pages', '{"title": "Quiz Emocional", "path": "/quiz"}'),
('radio_page', 'page', 'Rádio', 'Rádio e podcasts', 'radio', true, 4, 'pages', '{"title": "Rádio Fanática", "path": "/radio"}'),
('courses_page', 'page', 'Cursos', 'Página de cursos', 'graduation-cap', true, 5, 'pages', '{"title": "Cursos", "path": "/cursos"}'),
('football_page', 'page', 'Futebol', 'Notícias de futebol', 'trophy', true, 6, 'pages', '{"title": "Futebol", "path": "/futebol"}');

-- Create storage bucket for module images
INSERT INTO storage.buckets (id, name, public) VALUES ('module-images', 'module-images', true);

-- Create storage policies
CREATE POLICY "Anyone can view module images"
ON storage.objects FOR SELECT
USING (bucket_id = 'module-images');

CREATE POLICY "Developers can upload module images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'module-images' AND (has_role(auth.uid(), 'developer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Developers can update module images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'module-images' AND (has_role(auth.uid(), 'developer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Developers can delete module images"
ON storage.objects FOR DELETE
USING (bucket_id = 'module-images' AND (has_role(auth.uid(), 'developer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));