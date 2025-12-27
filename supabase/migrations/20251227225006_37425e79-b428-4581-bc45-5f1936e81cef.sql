-- Tabela para armazenar conteúdo editável do app
CREATE TABLE public.app_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'json')),
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para armazenar configurações de menus
CREATE TABLE public.app_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_menus ENABLE ROW LEVEL SECURITY;

-- Anyone can view content (public app)
CREATE POLICY "Anyone can view content" 
ON public.app_content 
FOR SELECT 
USING (true);

-- Only developers and admins can modify content
CREATE POLICY "Developers can manage content" 
ON public.app_content 
FOR ALL 
USING (has_role(auth.uid(), 'developer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view menus (public app)
CREATE POLICY "Anyone can view menus" 
ON public.app_menus 
FOR SELECT 
USING (true);

-- Only developers and admins can modify menus
CREATE POLICY "Developers can manage menus" 
ON public.app_menus 
FOR ALL 
USING (has_role(auth.uid(), 'developer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_app_content_updated_at
BEFORE UPDATE ON public.app_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_menus_updated_at
BEFORE UPDATE ON public.app_menus
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir conteúdos padrão
INSERT INTO public.app_content (key, value, type, category, description) VALUES
-- Header
('header_logo_text_1', 'fanatica', 'text', 'header', 'Primeira parte do logo no header'),
('header_logo_text_2', 'mente', 'text', 'header', 'Segunda parte do logo no header'),
('header_tagline', 'Saúde mental para torcedores', 'text', 'header', 'Tagline no menu lateral'),

-- Auth Page
('auth_logo_text_1', 'fanática', 'text', 'auth', 'Primeira parte do logo na página de auth'),
('auth_logo_text_2', 'MENTE', 'text', 'auth', 'Segunda parte do logo na página de auth'),
('auth_user_label', 'Torcedor', 'text', 'auth', 'Label do botão de usuário'),
('auth_professional_label', 'Profissional', 'text', 'auth', 'Label do botão de profissional'),
('auth_professional_area_title', 'Área do Profissional Parceiro', 'text', 'auth', 'Título da área profissional'),
('auth_professional_area_description', 'Acesse seu painel para gerenciar consultas e disponibilidade.', 'text', 'auth', 'Descrição da área profissional'),
('auth_professional_badge', '🩺 Área exclusiva para profissionais de saúde mental parceiros.', 'text', 'auth', 'Badge da área profissional'),

-- TunnelCard
('tunnel_subtitle', 'TÚNEL DE ACESSO', 'text', 'home', 'Subtítulo do card túnel'),
('tunnel_title_1', 'Encontre um', 'text', 'home', 'Primeira parte do título do túnel'),
('tunnel_title_2', 'Terapeuta', 'text', 'home', 'Segunda parte do título do túnel (destacada)'),

-- TicketCard
('ticket_logo_text_1', 'fanatica', 'text', 'home', 'Logo no ticket'),
('ticket_logo_text_2', 'mente', 'text', 'home', 'Logo no ticket (parte 2)'),
('ticket_championship', '🏆 Brasileirão da Saúde mental', 'text', 'home', 'Nome do campeonato'),
('ticket_title', 'SEU INGRESSO NO MUNDO\nDA CONSCIÊNCIA', 'text', 'home', 'Título principal do ticket'),
('ticket_time_label', 'Tempo:', 'text', 'home', 'Label tempo'),
('ticket_time_value', '60 min', 'text', 'home', 'Valor tempo'),
('ticket_price_label', 'Valor:', 'text', 'home', 'Label valor'),
('ticket_price_value', 'R$ 0,00', 'text', 'home', 'Valor preço'),
('ticket_address_label', 'ENDEREÇO:', 'text', 'home', 'Label endereço'),
('ticket_address_value', '(On-line)', 'text', 'home', 'Valor endereço'),
('ticket_button_text', 'COMECE POR AQUI', 'text', 'home', 'Texto do botão'),

-- QuizCard
('quiz_subtitle', 'Resenha', 'text', 'home', 'Subtítulo do quiz'),
('quiz_title_1', 'Treine sua habilidade de', 'text', 'home', 'Primeira parte do título'),
('quiz_title_highlight_1', 'escutar', 'text', 'home', 'Palavra destacada 1'),
('quiz_title_2', 'e se', 'text', 'home', 'Texto entre destaques'),
('quiz_title_highlight_2', 'comunicar!', 'text', 'home', 'Palavra destacada 2'),

-- FanatiClassCard
('fanaticlass_title_1', 'Fanati', 'text', 'home', 'Primeira parte do título'),
('fanaticlass_title_2', 'Class', 'text', 'home', 'Segunda parte (destacada)'),
('fanaticlass_description', 'Cursos online para desenvolver sua inteligência emocional', 'text', 'home', 'Descrição'),
('fanaticlass_badge_new', 'Novo', 'text', 'home', 'Badge novo'),
('fanaticlass_tag_free', 'Gratuitos', 'text', 'home', 'Tag gratuitos'),
('fanaticlass_tag_premium', 'Premium', 'text', 'home', 'Tag premium'),

-- RadioCard
('radio_title_1', 'Alambrado', 'text', 'home', 'Primeira parte do título'),
('radio_title_2', 'FM', 'text', 'home', 'Segunda parte (destacada)'),
('radio_description', 'As principais rádios esportivas do Brasil', 'text', 'home', 'Descrição'),
('radio_status', '27 estados • Ao vivo', 'text', 'home', 'Status da rádio');

-- Inserir menus padrão
INSERT INTO public.app_menus (menu_id, items) VALUES
('header_menu', '[
  {"icon": "Home", "label": "Início", "path": "/"},
  {"icon": "Users", "label": "Terapeutas", "path": "/terapeutas"},
  {"icon": "BookOpen", "label": "FanatiClass", "path": "/cursos"},
  {"icon": "Radio", "label": "Alambrado FM", "path": "/radio"},
  {"icon": "Newspaper", "label": "Notícias", "path": "/futebol"},
  {"icon": "User", "label": "Perfil", "path": "/perfil"}
]'),
('bottom_nav', '[
  {"icon": "Home", "label": "Início", "path": "/"},
  {"icon": "Users", "label": "Terapeutas", "path": "/terapeutas"},
  {"icon": "BookOpen", "label": "Cursos", "path": "/cursos"},
  {"icon": "Radio", "label": "Rádio", "path": "/radio"},
  {"icon": "User", "label": "Perfil", "path": "/perfil"}
]');