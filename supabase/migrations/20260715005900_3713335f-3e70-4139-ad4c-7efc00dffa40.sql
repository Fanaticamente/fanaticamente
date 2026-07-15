
-- Weekly challenges (config compartilhada por semana)
CREATE TABLE public.weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  target_count integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weekly_challenges TO anon, authenticated;
GRANT ALL ON public.weekly_challenges TO service_role;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weekly challenges public read" ON public.weekly_challenges
  FOR SELECT USING (true);
CREATE POLICY "Admins manage weekly challenges" ON public.weekly_challenges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer'));
CREATE TRIGGER trg_weekly_challenges_updated
  BEFORE UPDATE ON public.weekly_challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Progresso do usuário por desafio
CREATE TABLE public.user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_challenge_progress TO authenticated;
GRANT ALL ON public.user_challenge_progress TO service_role;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own challenge progress" ON public.user_challenge_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own challenge progress" ON public.user_challenge_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own challenge progress" ON public.user_challenge_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_user_challenge_progress_updated
  BEFORE UPDATE ON public.user_challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Semente do desafio da semana atual
INSERT INTO public.weekly_challenges (week_start, title, description, target_count)
VALUES (date_trunc('week', CURRENT_DATE)::date, 'Check-in emocional', 'Faça 5 check-ins de humor esta semana', 5)
ON CONFLICT (week_start) DO NOTHING;

-- Nova página na navegação
INSERT INTO public.app_pages (page_id, name, path, icon, description, is_visible, is_public, platform, order_index)
VALUES ('minha-temporada', 'Minha Temporada', '/minha-temporada', 'LayoutDashboard', 'Painel pessoal do torcedor', true, false, 'mobile', 5)
ON CONFLICT (page_id) DO UPDATE SET
  name = EXCLUDED.name, path = EXCLUDED.path, icon = EXCLUDED.icon,
  description = EXCLUDED.description, platform = EXCLUDED.platform;

-- Adiciona ao menu lateral do app
UPDATE public.app_menus
SET items = items || jsonb_build_array(
  jsonb_build_object('icon', 'LayoutDashboard', 'path', '/minha-temporada', 'label', 'Minha Temporada')
)
WHERE menu_id = 'header_menu'
  AND NOT (items @> '[{"path":"/minha-temporada"}]'::jsonb);
