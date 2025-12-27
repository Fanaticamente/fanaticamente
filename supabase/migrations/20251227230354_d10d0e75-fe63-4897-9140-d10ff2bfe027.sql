-- Drop the existing constraint and add a new one with 'color' type
ALTER TABLE public.app_content DROP CONSTRAINT IF EXISTS app_content_type_check;
ALTER TABLE public.app_content ADD CONSTRAINT app_content_type_check 
  CHECK (type = ANY (ARRAY['text'::text, 'image'::text, 'json'::text, 'color'::text]));

-- Add new fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Insert theme configuration content
INSERT INTO public.app_content (key, value, type, category, description)
VALUES 
  ('theme_primary', '45 100% 51%', 'color', 'theme', 'Cor primária do app (HSL)'),
  ('theme_secondary', '145 63% 32%', 'color', 'theme', 'Cor secundária do app (HSL)'),
  ('theme_accent', '210 100% 45%', 'color', 'theme', 'Cor de destaque do app (HSL)'),
  ('theme_background', '0 0% 8%', 'color', 'theme', 'Cor de fundo do app (HSL)'),
  ('theme_therapy', '280 60% 50%', 'color', 'theme', 'Cor da seção terapeutas (HSL)'),
  ('theme_quiz', '200 80% 50%', 'color', 'theme', 'Cor da seção quiz (HSL)'),
  ('theme_radio', '15 80% 50%', 'color', 'theme', 'Cor da seção rádio (HSL)')
ON CONFLICT (key) DO NOTHING;