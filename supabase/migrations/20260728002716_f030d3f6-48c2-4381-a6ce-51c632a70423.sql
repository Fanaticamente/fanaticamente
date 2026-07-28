
UPDATE public.app_pages SET path = '/comunidade', name = 'Comunidade', platform = 'mobile' WHERE page_id = 'ranking';
UPDATE public.app_pages SET page_id = 'agendamentos' WHERE page_id = 'meus-agendamentos';

INSERT INTO public.app_pages (page_id, name, path, icon, description, is_visible, is_public, platform, order_index)
SELECT v.page_id, v.name, v.path, v.icon, v.description, true, v.is_public, 'mobile', v.order_index
FROM (VALUES
  ('bem-estar', 'Bem-estar', '/bem-estar', 'heart', 'Painel de bem-estar e histórico emocional', false, 12),
  ('pagamentos', 'Pagamentos', '/pagamentos', 'file-text', 'Hub de pagamentos e assinaturas', false, 13),
  ('configuracoes', 'Configurações', '/configuracoes', 'file-text', 'Configurações da conta', false, 14),
  ('notificacoes', 'Notificações', '/notificacoes', 'file-text', 'Central de notificações', false, 15),
  ('meus-cursos', 'Meus Cursos', '/meus-cursos', 'graduation-cap', 'Cursos adquiridos pelo usuário', false, 16)
) AS v(page_id, name, path, icon, description, is_public, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.app_pages p WHERE p.page_id = v.page_id);

UPDATE public.app_modules SET page = 'home_legacy', is_visible = false WHERE page = 'home';

INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
SELECT v.module_id, v.module_type, v.name, v.description, v.icon, true, v.order_index, 'home', v.config::jsonb
FROM (VALUES
  ('home_greeting', 'text', 'Saudação', 'Saudação e subtítulo do topo da home', 'layout', 1,
   '{"subtitle":"Saúde Mental agora é papo de arquibancada!"}'),
  ('home_next_match', 'card', 'Próxima partida', 'Barra com a próxima partida do clube do coração', 'trophy', 2,
   '{"title":"Próxima partida"}'),
  ('home_checkin', 'card', 'Check-in emocional', 'Bloco de check-in de humor diário', 'brain', 3,
   '{"kicker":"Check-in emocional","title":"Como você está hoje?","subtitle":"Cada dia é uma rodada!"}'),
  ('home_suggestions', 'list', 'Carrossel de sugestões', 'Itens sugeridos exibidos na home', 'image', 4,
   '{"items":[
      {"kicker":"Sugestão para você","title":"Campo das emoções","subtitle":"Escale seu time e gere uma reflexão","path":"/diario"},
      {"kicker":"Curso em destaque","title":"Ética & Responsabilidade Social no Futebol","subtitle":"Comece agora mesmo","path":"/curso/c6c7600e-de31-4adc-935e-75a9dd30beba"},
      {"kicker":"Cuide de você","title":"Converse com um(a) especialista","subtitle":"Terapeutas disponíveis","path":"/terapeutas"},
      {"kicker":"Ao vivo","title":"Alambrado FM","subtitle":"Acompanhe as rádios esportivas","path":"/radio"},
      {"kicker":"Fique por dentro","title":"Conteúdos sobre Futebol & Saúde","subtitle":"Últimas atualizações","path":"/futebol"},
      {"kicker":"Comunidade","title":"Brasileirão da Saúde Mental","subtitle":"Veja como estão os clubes e torcida","path":"/comunidade?openClubs=1"}
   ]}'),
  ('home_shortcuts', 'list', 'Acesso rápido', 'Atalhos em grade na home', 'navigation', 5,
   '{"title":"Acesso rápido","items":[
      {"icon":"CalendarDays","label":"Consultas","path":"/meus-agendamentos"},
      {"icon":"Users","label":"Terapeutas","path":"/terapeutas"},
      {"icon":"GraduationCap","label":"Cursos","path":"/cursos"},
      {"icon":"Heart","label":"Bem-estar","path":"/bem-estar"}
   ]}')
) AS v(module_id, module_type, name, description, icon, order_index, config)
WHERE NOT EXISTS (SELECT 1 FROM public.app_modules m WHERE m.module_id = v.module_id);

UPDATE public.app_menus
SET items = '[
  {"icon":"Home","label":"Início","path":"/"},
  {"icon":"Heart","label":"Bem-estar","path":"/bem-estar"},
  {"icon":"Community","label":"Comunidade","path":"/comunidade"},
  {"icon":"User","label":"Você","path":"/perfil"}
]'::jsonb
WHERE menu_id = 'bottom_nav';
