-- Ensure bottom_nav exists in app_menus so it can be edited in the Dev MenuEditor
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_menus WHERE menu_id = 'bottom_nav') THEN
    INSERT INTO public.app_menus (menu_id, items)
    VALUES (
      'bottom_nav',
      '[
        {"icon":"Home","label":"Início","path":"/"},
        {"icon":"Thermometer","label":"Termômetro","path":"/diario"},
        {"icon":"Newspaper","label":"Futebol","path":"/futebol"},
        {"icon":"Shirt","label":"FanaticaShop","path":"/loja"}
      ]'::jsonb
    );
  END IF;
END $$;
