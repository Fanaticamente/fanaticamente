-- Tabela de conexões Google Calendar dos profissionais
CREATE TABLE public.professional_google_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL UNIQUE,
  google_email text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  sync_token text,
  webhook_channel_id text,
  webhook_resource_id text,
  webhook_token text,
  webhook_expires_at timestamptz,
  last_synced_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_google_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals view own gcal connection"
ON public.professional_google_calendar FOR SELECT
USING (EXISTS (SELECT 1 FROM professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));

CREATE POLICY "Professionals delete own gcal connection"
ON public.professional_google_calendar FOR DELETE
USING (EXISTS (SELECT 1 FROM professionals p WHERE p.id = professional_id AND p.user_id = auth.uid()));

CREATE POLICY "Service role full access gcal connection"
ON public.professional_google_calendar FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_pgc_updated_at
BEFORE UPDATE ON public.professional_google_calendar
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de bloqueios derivados do Google Calendar (cache local)
CREATE TABLE public.google_calendar_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  google_event_id text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  summary text,
  is_all_day boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, google_event_id)
);

ALTER TABLE public.google_calendar_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gcal blocks"
ON public.google_calendar_blocks FOR SELECT
USING (true);

CREATE POLICY "Service role full access gcal blocks"
ON public.google_calendar_blocks FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_gcal_blocks_prof_time ON public.google_calendar_blocks (professional_id, start_time, end_time);

CREATE TRIGGER update_gcb_updated_at
BEFORE UPDATE ON public.google_calendar_blocks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mapeamento appointment ↔ google event
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_event_id text;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.google_calendar_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_google_calendar;