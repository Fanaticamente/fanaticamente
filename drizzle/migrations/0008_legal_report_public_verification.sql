CREATE TABLE public.legal_report_registry (
  code text PRIMARY KEY,
  report_id text NOT NULL,
  manifest jsonb NOT NULL,
  manifest_sha256 text NOT NULL,
  signature text NOT NULL,
  key_id text NOT NULL,
  report_type text NOT NULL,
  record_count integer NOT NULL,
  generated_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','revoked','superseded')),
  revoked_by uuid,
  revoked_at timestamptz,
  revocation_reason text,
  superseded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_report_registry TO authenticated;
GRANT ALL ON public.legal_report_registry TO service_role;
ALTER TABLE public.legal_report_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read report registry"
  ON public.legal_report_registry FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.legal_report_registry_protect()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.code <> OLD.code OR NEW.report_id <> OLD.report_id
       OR NEW.manifest <> OLD.manifest OR NEW.manifest_sha256 <> OLD.manifest_sha256
       OR NEW.signature <> OLD.signature OR NEW.key_id <> OLD.key_id
       OR NEW.record_count <> OLD.record_count OR NEW.generated_at <> OLD.generated_at THEN
      RAISE EXCEPTION 'legal_report_registry: report content is immutable';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'legal_report_registry is append-only';
END;
$$;
CREATE TRIGGER legal_report_registry_protect_row BEFORE UPDATE OR DELETE ON public.legal_report_registry
  FOR EACH ROW EXECUTE FUNCTION public.legal_report_registry_protect();
CREATE TRIGGER legal_report_registry_protect_truncate BEFORE TRUNCATE ON public.legal_report_registry
  FOR EACH STATEMENT EXECUTE FUNCTION public.legal_report_registry_protect();

CREATE TABLE public.legal_report_verify_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_attempted text,
  result text NOT NULL,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_report_verify_log TO authenticated;
GRANT ALL ON public.legal_report_verify_log TO service_role;
ALTER TABLE public.legal_report_verify_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read verify log"
  ON public.legal_report_verify_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.legal_report_verify_log_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'legal_report_verify_log is append-only';
END;
$$;
CREATE TRIGGER legal_report_verify_log_no_update BEFORE UPDATE OR DELETE ON public.legal_report_verify_log
  FOR EACH STATEMENT EXECUTE FUNCTION public.legal_report_verify_log_immutable();
CREATE TRIGGER legal_report_verify_log_no_truncate BEFORE TRUNCATE ON public.legal_report_verify_log
  FOR EACH STATEMENT EXECUTE FUNCTION public.legal_report_verify_log_immutable();

ALTER TABLE public.legal_report_events DROP CONSTRAINT legal_report_events_action_check;
ALTER TABLE public.legal_report_events ADD CONSTRAINT legal_report_events_action_check CHECK (action IN ('generate','verify','revoke'));