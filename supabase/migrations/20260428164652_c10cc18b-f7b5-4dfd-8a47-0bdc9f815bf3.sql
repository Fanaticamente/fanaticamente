
-- Subscription Plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  discount INTEGER,
  period TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT USING (true);

CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Subscription Settings (singleton)
CREATE TABLE public.subscription_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriptions_enabled BOOLEAN NOT NULL DEFAULT true,
  free_period_banner_enabled BOOLEAN NOT NULL DEFAULT false,
  free_period_banner_text TEXT NOT NULL DEFAULT 'Aproveite! Por tempo limitado as assinaturas para profissionais são gratuitas!',
  reactivation_warning_enabled BOOLEAN NOT NULL DEFAULT false,
  reactivation_warning_text TEXT NOT NULL DEFAULT 'Atenção: as assinaturas serão reativadas em breve. Prepare-se para escolher seu plano.',
  onboarding_subscription_text TEXT NOT NULL DEFAULT 'Escolha seu Plano',
  onboarding_subscription_subtitle TEXT NOT NULL DEFAULT 'Selecione o plano ideal para ativar seu perfil no marketplace',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription settings"
  ON public.subscription_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage subscription settings"
  ON public.subscription_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscription_settings_updated_at
  BEFORE UPDATE ON public.subscription_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed plans
INSERT INTO public.subscription_plans (plan_id, name, price, original_price, discount, period, features, is_popular, order_index) VALUES
('monthly', 'Mensal', 199.90, NULL, NULL, 'mês',
  '["Perfil visível no marketplace","Sistema de agendamento","Painel de métricas básico","Suporte por email"]'::jsonb,
  false, 0),
('semiannual', 'Semestral', 1079.90, 1199.40, 10, 'semestre',
  '["Tudo do plano Mensal","Destaque no ranking de busca","Selo de profissional destaque","Suporte prioritário"]'::jsonb,
  true, 1),
('annual', 'Anual', 2038.90, 2398.80, 15, 'ano',
  '["Tudo do plano Semestral","Posição premium no marketplace","Acesso antecipado a novidades","Mentoria exclusiva trimestral"]'::jsonb,
  false, 2);

-- Seed singleton settings (subscriptions DISABLED + free banner ENABLED, per user request)
INSERT INTO public.subscription_settings (subscriptions_enabled, free_period_banner_enabled, free_period_banner_text)
VALUES (false, true, 'Aproveite! Por tempo limitado as assinaturas para profissionais são gratuitas!');
