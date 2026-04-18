-- Add FanatiCazé TV item to header menu
UPDATE public.app_menus
SET items = items || '[{"icon":"Tv","label":"FanatiCazé TV","path":"/fanaticaze-tv"}]'::jsonb
WHERE menu_id = 'header_menu'
  AND NOT (items::jsonb @> '[{"path":"/fanaticaze-tv"}]'::jsonb);

-- Register the page so DynamicProtectedRoute resolves visibility
INSERT INTO public.app_pages (page_id, name, path, icon, is_public, is_visible, order_index, platform, description)
VALUES ('fanaticaze-tv', 'FanatiCazé TV', '/fanaticaze-tv', 'Tv', false, true, 70, 'mobile', 'Canal CazéTV exclusivo dentro do app')
ON CONFLICT (page_id) DO NOTHING;