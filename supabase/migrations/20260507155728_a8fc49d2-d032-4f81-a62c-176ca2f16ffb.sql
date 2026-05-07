
-- Events: source of truth for "what happened"
CREATE TABLE public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_events_unprocessed ON public.notification_events (scheduled_for) WHERE processed_at IS NULL;
CREATE INDEX idx_notification_events_type ON public.notification_events (event_type);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins/devs manage events" ON public.notification_events
  FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'developer'));
CREATE POLICY "Service role full" ON public.notification_events
  FOR ALL USING (auth.role()='service_role') WITH CHECK (auth.role()='service_role');

-- Rules: how to react to events
CREATE TABLE public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text NOT NULL,
  audience text NOT NULL DEFAULT 'event_user', -- 'event_user' | 'event_payload_target' | 'role:professional' | 'role:user' | 'all'
  title_template text NOT NULL,
  body_template text NOT NULL,
  link_template text,
  type text NOT NULL DEFAULT 'info',
  cooldown_hours int NOT NULL DEFAULT 0,
  quiet_hours_start int, -- 0-23
  quiet_hours_end int,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_rules_event ON public.notification_rules (event_type) WHERE is_active=true;

ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins/devs manage rules" ON public.notification_rules
  FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'developer'));

CREATE TRIGGER trg_notification_rules_updated
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track which (rule, user) was already fired (for cooldown)
CREATE TABLE public.notification_rule_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_id uuid,
  fired_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rule_runs_lookup ON public.notification_rule_runs (rule_id, user_id, fired_at DESC);
ALTER TABLE public.notification_rule_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins/devs view runs" ON public.notification_rule_runs
  FOR SELECT USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'developer'));
CREATE POLICY "Service role full runs" ON public.notification_rule_runs
  FOR ALL USING (auth.role()='service_role') WITH CHECK (auth.role()='service_role');

-- Trigger: emit appointment_created event
CREATE OR REPLACE FUNCTION public.emit_appointment_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prof_user uuid;
BEGIN
  SELECT user_id INTO prof_user FROM public.professionals WHERE id = NEW.professional_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notification_events(event_type, user_id, payload)
    VALUES ('appointment_created', prof_user, jsonb_build_object(
      'appointment_id', NEW.id,
      'patient_user_id', NEW.user_id,
      'professional_id', NEW.professional_id,
      'scheduled_date', NEW.scheduled_date,
      'scheduled_time', NEW.scheduled_time
    ));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('confirmed','confirmado') THEN
      INSERT INTO public.notification_events(event_type, user_id, payload)
      VALUES ('appointment_confirmed', NEW.user_id, jsonb_build_object(
        'appointment_id', NEW.id,
        'professional_id', NEW.professional_id,
        'scheduled_date', NEW.scheduled_date,
        'scheduled_time', NEW.scheduled_time
      ));
    ELSIF NEW.status IN ('cancelled','cancelado','rejected','rejeitado') THEN
      INSERT INTO public.notification_events(event_type, user_id, payload)
      VALUES ('appointment_cancelled', NEW.user_id, jsonb_build_object(
        'appointment_id', NEW.id,
        'professional_id', NEW.professional_id,
        'reason', NEW.rejection_reason
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointment_events
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.emit_appointment_event();

-- Seed 3 starter rules
INSERT INTO public.notification_rules (name, event_type, audience, title_template, body_template, link_template, type, cooldown_hours)
VALUES
  ('Profissional: novo agendamento', 'appointment_created', 'event_user',
   'Novo agendamento recebido',
   'Você tem um novo agendamento para {{scheduled_date}} às {{scheduled_time}}.',
   '/professional?tab=appointments', 'info', 0),
  ('Paciente: agendamento confirmado', 'appointment_confirmed', 'event_user',
   'Sessão confirmada',
   'Sua sessão em {{scheduled_date}} às {{scheduled_time}} foi confirmada.',
   '/meus-agendamentos', 'success', 0),
  ('Paciente: agendamento cancelado', 'appointment_cancelled', 'event_user',
   'Agendamento cancelado',
   'Seu agendamento foi cancelado. Veja os detalhes no app.',
   '/meus-agendamentos', 'warning', 0);
