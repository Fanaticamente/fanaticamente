
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
VALUES
 ('football_tabs','list','Abas / Submenus','Abas da página Conteúdo (Futebol)','LayoutTemplate',true,0,'futebol',
  '{"tabs":[{"key":"todos","label":"Todos","visible":true},{"key":"noticias","label":"Notícias","visible":true},{"key":"tabela","label":"Tabela","visible":true},{"key":"videos","label":"Vídeos","visible":true},{"key":"podcasts","label":"Podcasts","visible":true},{"key":"dicas","label":"Dicas","visible":true}]}'::jsonb),
 ('football_news_section','section','Notícias','Configuração da aba Notícias','Newspaper',true,1,'futebol',
  '{"subtitle":"Últimas do futebol brasileiro e sul-americano","featured_title":"Em destaque","recent_title":"Mais recentes","show_club_filter":true,"max_items":20}'::jsonb),
 ('football_table','config','Tabela dos Campeonatos','Escudos, bandeirinhas e campeonatos exibidos','Trophy',true,2,'futebol',
  '{"show_badges":true,"club_display_mode":"badge","hidden_badges":[],"leagues":[{"key":"serie-a","label":"Brasileirão Série A","visible":true},{"key":"serie-b","label":"Brasileirão Série B","visible":true},{"key":"serie-c","label":"Brasileirão Série C","visible":true},{"key":"copa-do-brasil","label":"Copa do Brasil","visible":true},{"key":"libertadores","label":"Libertadores","visible":true},{"key":"sul-americana","label":"Sul-Americana","visible":true}]}'::jsonb),
 ('football_videos','list','Vídeos','Conteúdos em vídeo da aba Vídeos','Play',true,3,'futebol','{"empty_text":"Novos vídeos aparecerão aqui em breve.","items":[]}'::jsonb),
 ('football_podcasts','list','Podcasts','Episódios de áudio da aba Podcasts','Headphones',true,4,'futebol','{"empty_text":"Novos episódios aparecerão aqui em breve.","items":[]}'::jsonb),
 ('football_dicas','list','Dicas','Dicas publicadas na aba Dicas','Lightbulb',true,5,'futebol','{"empty_text":"Novas dicas aparecerão aqui em breve.","items":[]}'::jsonb)
ON CONFLICT (module_id) DO NOTHING;
