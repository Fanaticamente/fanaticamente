-- Insert desktop modules for the website content manager
-- These modules correspond to the sections in the desktop homepage

-- Hero Section - Carousel
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
VALUES 
  ('desktop_hero_carousel', 'carousel', 'Carrossel Hero', 'Banner rotativo principal do site', 'image', true, 0, 'desktop', 
   '{"slides": [{"image": "", "title": "CRIADO POR QUEM SENTE.", "subtitle": "A primeira plataforma do mundo focada na saúde mental dos torcedores de futebol.", "titleColor": "#FFFFFF", "subtitleColor": "#d1d5db"}, {"image": "", "title": "PARA QUEM VIBRA.", "subtitle": "Conectamos você aos melhores profissionais que entendem a paixão pelo futebol.", "titleColor": "#FFFFFF", "subtitleColor": "#d1d5db"}, {"image": "", "title": "JUNTOS SOMOS MUITOS.", "subtitle": "Cada um com seu clube, mas todos no mesmo time pela saúde mental.", "titleColor": "#FFFFFF", "subtitleColor": "#d1d5db"}]}'::jsonb);

-- Features Section
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
VALUES 
  ('desktop_features_section', 'section', 'Seção Diferenciais', 'Cards de diferenciais do serviço', 'layout', true, 1, 'desktop',
   '{"title": "O QUE FAZEMOS POR VOCÊ", "subtitle": "Reunimos o que há de melhor para cuidar da sua saúde mental sem abrir mão da sua paixão.", "items": [{"icon": "therapist", "title": "TERAPEUTAS", "description": "Profissionais especializados em saúde mental no contexto esportivo."}, {"icon": "entertainment", "title": "ENTRETENIMENTO", "description": "Conteúdo exclusivo que une futebol e bem-estar."}, {"icon": "knowledge", "title": "CONHECIMENTO", "description": "Cursos e materiais sobre equilíbrio emocional."}, {"icon": "jersey", "title": "CAMISAS", "description": "Produtos exclusivos para torcedores conscientes."}]}'::jsonb);

-- Curiosities Section  
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
VALUES 
  ('desktop_curiosities_section', 'section', 'Seção Curiosidades', 'Estatísticas e dados relevantes', 'bar-chart', true, 2, 'desktop',
   '{"title": "VOCÊ SABIA?", "items": [{"number": "65%", "description": "dos torcedores relatam ansiedade em dias de jogo"}, {"number": "48%", "description": "sentem tristeza profunda após derrotas importantes"}, {"number": "72%", "description": "nunca procuraram ajuda profissional"}]}'::jsonb);

-- About Section
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
VALUES 
  ('desktop_about_section', 'section', 'Seção Sobre', 'Texto sobre a Fanática', 'file-text', true, 3, 'desktop',
   '{"title": "SOBRE A FANÁTICA", "subtitle": "Nascemos da compreensão de que a paixão pelo futebol é muito mais do que um hobby — é uma parte fundamental da identidade de milhões de brasileiros.", "description": "Nossa missão é oferecer suporte especializado para que cada torcedor possa viver sua paixão de forma equilibrada e saudável, transformando a intensidade das emoções em força e autoconhecimento.", "image": ""}'::jsonb);

-- Testimonials Section
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
VALUES 
  ('desktop_testimonials_section', 'section', 'Seção Depoimentos', 'Depoimentos de usuários', 'message-square', true, 4, 'desktop',
   '{"title": "O QUE DIZEM SOBRE NÓS", "testimonials": [{"name": "Carlos M.", "club": "Flamengo", "text": "Finalmente encontrei um espaço onde posso falar sobre como o futebol afeta minha vida sem ser julgado.", "avatar": ""}, {"name": "Ana P.", "club": "Corinthians", "text": "A plataforma me ajudou a entender que cuidar da saúde mental não diminui minha paixão pelo clube.", "avatar": ""}, {"name": "Roberto S.", "club": "Palmeiras", "text": "Os profissionais entendem de verdade o que é ser torcedor. Isso faz toda a diferença.", "avatar": ""}]}'::jsonb);

-- Professional Form Section
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
VALUES 
  ('desktop_professional_form', 'form', 'Formulário Profissionais', 'Formulário de captação de profissionais', 'users', true, 5, 'desktop',
   '{"title": "JUNTE-SE A NÓS", "subtitle": "É psicólogo e quer fazer parte da nossa rede?", "description": "Cadastre-se para ser um dos profissionais credenciados da Fanática e ajude torcedores a cuidarem da saúde mental.", "buttonText": "Quero me cadastrar", "buttonLink": "/auth?tab=profissional"}'::jsonb);

-- Footer Section
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
VALUES 
  ('desktop_footer', 'footer', 'Rodapé', 'Rodapé do site com links e redes sociais', 'layout', true, 6, 'desktop',
   '{"copyright": "© 2024 Fanática. Todos os direitos reservados.", "links": [{"label": "Início", "path": "/"}, {"label": "Terapeutas", "path": "/terapeutas"}, {"label": "OSMF", "path": "/osmf"}, {"label": "Privacidade", "path": "/privacy-policy"}], "socialLinks": [{"platform": "instagram", "url": "https://instagram.com/fanaticamente"}, {"platform": "twitter", "url": "https://twitter.com/fanaticamente"}]}'::jsonb);