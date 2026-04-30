UPDATE public.app_modules
SET config = COALESCE(config, '{}'::jsonb) || jsonb_build_object('show_badges', true, 'hidden_badges', '[]'::jsonb)
WHERE module_id = 'football_page';

INSERT INTO public.app_modules (module_id, module_type, name, description, is_visible, page, config)
VALUES (
  'sidebar_user_club',
  'config',
  'Time do usuário (sidebar)',
  'Exibe o escudo do clube favorito do usuário no menu lateral.',
  true,
  'config',
  jsonb_build_object('show_badges', true, 'hidden_badges', '[]'::jsonb)
)
ON CONFLICT (module_id) DO UPDATE
SET config = COALESCE(public.app_modules.config, '{}'::jsonb) || jsonb_build_object('show_badges', true, 'hidden_badges', '[]'::jsonb);