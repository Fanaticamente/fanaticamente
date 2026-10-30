CREATE TABLE public.legal_report_keys (
  key_id text PRIMARY KEY,
  algorithm text NOT NULL DEFAULT 'Ed25519',
  public_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_report_keys TO anon, authenticated;
GRANT ALL ON public.legal_report_keys TO service_role;
ALTER TABLE public.legal_report_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read report verification keys"
  ON public.legal_report_keys FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.legal_report_keys (key_id, algorithm, public_key)
VALUES ('legal-report-ed25519-2026-10', 'Ed25519', 'MCowBQYDK2VwAyEAkWvsd2sxY0XKielq39lHdb/3FNtFI6kwqJZM4pQb7Hc=');

CREATE TABLE public.legal_report_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text NOT NULL,
  admin_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('generate','verify')),
  report_type text,
  record_count integer,
  file_manifest jsonb,
  signature text,
  verification_result text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_report_events TO authenticated;
GRANT ALL ON public.legal_report_events TO service_role;
ALTER TABLE public.legal_report_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read report events"
  ON public.legal_report_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.legal_report_events_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'legal_report_events is append-only';
END;
$$;
CREATE TRIGGER legal_report_events_no_update BEFORE UPDATE OR DELETE OR TRUNCATE ON public.legal_report_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.legal_report_events_immutable();