
-- Tabela de templates de notificação
CREATE TABLE public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text,
  icon text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and devs can manage templates"
ON public.notification_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Admins and devs can view templates"
ON public.notification_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

-- Tabela de automações
CREATE TABLE public.notification_automations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  trigger_event text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text,
  target_role text NOT NULL DEFAULT 'user',
  is_active boolean NOT NULL DEFAULT true,
  delay_minutes integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and devs can manage automations"
ON public.notification_automations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

-- Tabela de log de envios
CREATE TABLE public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text,
  target text NOT NULL DEFAULT 'all',
  target_user_id uuid,
  in_app_sent integer NOT NULL DEFAULT 0,
  push_sent integer NOT NULL DEFAULT 0,
  push_failed integer NOT NULL DEFAULT 0,
  sent_by uuid,
  automation_id uuid REFERENCES public.notification_automations(id) ON DELETE SET NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and devs can view logs"
ON public.notification_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Admins and devs can insert logs"
ON public.notification_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

-- Triggers para updated_at
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_automations_updated_at
  BEFORE UPDATE ON public.notification_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
