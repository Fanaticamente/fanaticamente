
INSERT INTO public.app_modules (module_id, module_type, name, description, icon, is_visible, order_index, page, config)
SELECT v.module_id, v.module_type, v.name, v.description, v.icon, true, v.order_index, 'home', v.config::jsonb
FROM (VALUES
  ('home_journey', 'card', 'Sua jornada', 'Bloco de progresso semanal', 'trophy', 6,
   '{"title":"Sua jornada","cta":"Ver evolução detalhada","link":"/minha-temporada"}'),
  ('home_fanbase', 'card', 'Torcida', 'Bloco de convite ao ranking da torcida', 'users', 7,
   '{"title":"Juntos na arquibancada e na evolução!","subtitle":"Veja os torcedores que estão cuidando da mente.","cta":"Ver ranking","link":"/comunidade?openFans=1"}')
) AS v(module_id, module_type, name, description, icon, order_index, config)
WHERE NOT EXISTS (SELECT 1 FROM public.app_modules m WHERE m.module_id = v.module_id);
