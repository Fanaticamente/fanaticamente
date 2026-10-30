-- ============ 1. Append-only technical security event log ============
CREATE TABLE public.legal_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.legal_security_events IS 'Append-only technical security log (auth failures, tamper attempts, report/timestamp/chain failures). Must never store passwords, tokens, private keys, clinical content or unnecessary personal data.';

CREATE INDEX legal_security_events_created_idx ON public.legal_security_events (created_at DESC);
CREATE INDEX legal_security_events_severity_idx ON public.legal_security_events (severity) WHERE severity = 'critical';

GRANT ALL ON public.legal_security_events TO service_role;
ALTER TABLE public.legal_security_events ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge functions) writes; admins read via RPC.

CREATE OR REPLACE FUNCTION public.legal_security_events_immutable()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF TG_OP = 'DELETE' AND current_setting('app.legal_purge', true) = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'legal_security_events is append-only: % not allowed', TG_OP;
END;
$fn$;

CREATE TRIGGER legal_security_events_no_update BEFORE UPDATE ON public.legal_security_events
  FOR EACH ROW EXECUTE FUNCTION public.legal_security_events_immutable();
CREATE TRIGGER legal_security_events_no_delete BEFORE DELETE ON public.legal_security_events
  FOR EACH ROW EXECUTE FUNCTION public.legal_security_events_immutable();
CREATE TRIGGER legal_security_events_no_truncate BEFORE TRUNCATE ON public.legal_security_events
  FOR EACH STATEMENT EXECUTE FUNCTION public.legal_security_events_immutable();

-- ============ 2. Scheduled audit run history ============
CREATE TABLE public.legal_audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_source text NOT NULL, -- 'cron' | 'admin'
  ok boolean NOT NULL,
  records_checked integer NOT NULL DEFAULT 0,
  anchors jsonb NOT NULL DEFAULT '{}',
  divergences jsonb NOT NULL DEFAULT '[]',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.legal_audit_runs IS 'Append-only history of chain/anchor audit runs (scheduled and manual).';

GRANT ALL ON public.legal_audit_runs TO service_role;
ALTER TABLE public.legal_audit_runs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER legal_audit_runs_no_update BEFORE UPDATE ON public.legal_audit_runs
  FOR EACH ROW EXECUTE FUNCTION public.legal_security_events_immutable();
CREATE TRIGGER legal_audit_runs_no_delete BEFORE DELETE ON public.legal_audit_runs
  FOR EACH ROW EXECUTE FUNCTION public.legal_security_events_immutable();
CREATE TRIGGER legal_audit_runs_no_truncate BEFORE TRUNCATE ON public.legal_audit_runs
  FOR EACH STATEMENT EXECUTE FUNCTION public.legal_security_events_immutable();

-- ============ 3. Admin read RPCs (security definer, role-checked) ============
CREATE OR REPLACE FUNCTION public.admin_legal_security_events(_limit integer DEFAULT 100)
RETURNS TABLE(id uuid, event_type text, severity text, detail jsonb, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT e.id, e.event_type, e.severity, e.detail, e.created_at
  FROM public.legal_security_events e
  ORDER BY e.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 500);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.admin_legal_audit_runs(_limit integer DEFAULT 30)
RETURNS TABLE(id uuid, trigger_source text, ok boolean, records_checked integer, anchors jsonb, divergences jsonb, error text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT r.id, r.trigger_source, r.ok, r.records_checked, r.anchors, r.divergences, r.error, r.created_at
  FROM public.legal_audit_runs r
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(_limit, 1), 100);
END;
$fn$;

-- ============ 4. Cron configuration (secret stored out-of-band, never in repo) ============
CREATE TABLE public.legal_cron_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.legal_cron_config IS 'Internal cron configuration. Service role only; values are set out-of-band and never committed to the repository.';

GRANT ALL ON public.legal_cron_config TO service_role;
ALTER TABLE public.legal_cron_config ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.legal_cron_config_immutable()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  RAISE EXCEPTION 'legal_cron_config does not accept % via database triggers', TG_OP;
END;
$fn$;

CREATE TRIGGER legal_cron_config_no_update BEFORE UPDATE ON public.legal_cron_config
  FOR EACH ROW EXECUTE FUNCTION public.legal_cron_config_immutable();
CREATE TRIGGER legal_cron_config_no_delete BEFORE DELETE ON public.legal_cron_config
  FOR EACH ROW EXECUTE FUNCTION public.legal_cron_config_immutable();

-- ============ 5. Daily scheduled audit via pg_cron + pg_net ============
CREATE OR REPLACE FUNCTION public.legal_audit_dispatch()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  secret text;
BEGIN
  SELECT value INTO secret FROM public.legal_cron_config WHERE key = 'audit_secret';
  IF secret IS NULL THEN
    RAISE WARNING 'legal_audit_dispatch: audit_secret not configured in legal_cron_config';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url := 'https://jehgvrskdyijirecznii.supabase.co/functions/v1/scheduled-legal-audit',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Lovable-Context', 'cron',
      'Authorization', 'Bearer ' || secret
    ),
    body := '{}'::jsonb
  );
END;
$fn$;

SELECT cron.schedule('legal-audit-daily', '0 6 * * *', $cron$ SELECT public.legal_audit_dispatch(); $cron$);

-- ============ 6. Retention: purge old technical events (1 year) ============
CREATE OR REPLACE FUNCTION public.purge_operational_logs()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  DELETE FROM public.notification_logs WHERE sent_at < now() - interval '90 days';
  DELETE FROM public.notification_events WHERE processed_at IS NOT NULL AND processed_at < now() - interval '30 days';
  DELETE FROM public.notification_rule_runs WHERE fired_at < now() - interval '90 days';
  DELETE FROM public.email_send_log WHERE created_at < now() - interval '60 days';
  -- Legal security events and audit runs: long retention, then hard purge.
  -- The purge sets a session flag so the append-only triggers allow it.
  PERFORM set_config('app.legal_purge', 'on', true);
  DELETE FROM public.legal_security_events WHERE created_at < now() - interval '1 year';
  DELETE FROM public.legal_audit_runs WHERE created_at < now() - interval '2 years';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'purge_operational_logs failed: %', SQLERRM;
END;
$fn$;