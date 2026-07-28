UPDATE public.app_modules
SET name = 'Comunidade',
    config = jsonb_set(coalesce(config,'{}'::jsonb), '{path}', '"/comunidade"') || '{"title":"Comunidade"}'::jsonb,
    icon = 'users'
WHERE module_id = 'ranking_page';

INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
VALUES
 ('diario_page','page','Diário','Campo das emoções e atividades','brain',true,10,'pages','{"title":"Diário","path":"/diario"}'),
 ('bem_estar_page','page','Bem-estar','Histórico emocional e gráficos','heart',true,11,'pages','{"title":"Bem-estar","path":"/bem-estar"}'),
 ('minha_temporada_page','page','Minha Temporada','Dashboard do torcedor','trophy',true,12,'pages','{"title":"Minha Temporada","path":"/minha-temporada"}'),
 ('setor_saude_page','page','Setor Saúde','Notícias de saúde mental','newspaper',true,13,'pages','{"title":"Setor Saúde","path":"/setor-saude"}'),
 ('meus_cursos_page','page','Meus Cursos','Cursos adquiridos','graduation-cap',true,14,'pages','{"title":"Meus Cursos","path":"/meus-cursos"}'),
 ('agendamentos_page','page','Meus Agendamentos','Sessões agendadas','calendar',true,15,'pages','{"title":"Meus Agendamentos","path":"/meus-agendamentos"}'),
 ('perfil_page','page','Perfil','Perfil do usuário','user',true,16,'pages','{"title":"Perfil","path":"/perfil"}'),
 ('notificacoes_page','page','Notificações','Central de notificações','bell',true,17,'pages','{"title":"Notificações","path":"/notificacoes"}'),
 ('pagamentos_page','page','Pagamentos','Hub de pagamentos','ticket',true,18,'pages','{"title":"Pagamentos","path":"/pagamentos"}'),
 ('configuracoes_page','page','Configurações','Preferências do app','settings',true,19,'pages','{"title":"Configurações","path":"/configuracoes"}')
ON CONFLICT (module_id) DO NOTHING;