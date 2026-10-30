-- ============ 1. Hash chain of acceptance records ============
CREATE TABLE public.legal_acceptance_chain (
  seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  acceptance_id uuid NOT NULL REFERENCES public.legal_acceptances(id) ON DELETE RESTRICT,
  record_payload text NOT NULL,
  record_hash text NOT NULL,
  prev_hash text NOT NULL,
  chain_hash text NOT NULL,
  algorithm text NOT NULL DEFAULT 'SHA-256',
  document_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.legal_acceptance_chain IS 'Append-only hash chain over legal_acceptances. chain_hash = sha256(record_hash || ''|'' || prev_hash). Genesis entry prev_hash starts with GENESIS:.';

GRANT ALL ON public.legal_acceptance_chain TO service_role;
ALTER TABLE public.legal_acceptance_chain ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (edge functions) can read/write.

-- Immutability: no update, delete or truncate of chain rows.
CREATE OR REPLACE FUNCTION public.legal_chain_immutable()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  RAISE EXCEPTION 'legal_acceptance_chain is append-only: % not allowed', TG_OP;
END;
$fn$;

CREATE TRIGGER legal_chain_no_update BEFORE UPDATE ON public.legal_acceptance_chain
  FOR EACH ROW EXECUTE FUNCTION public.legal_chain_immutable();
CREATE TRIGGER legal_chain_no_delete BEFORE DELETE ON public.legal_acceptance_chain
  FOR EACH ROW EXECUTE FUNCTION public.legal_chain_immutable();
CREATE TRIGGER legal_chain_no_truncate BEFORE TRUNCATE ON public.legal_acceptance_chain
  FOR EACH STATEMENT EXECUTE FUNCTION public.legal_chain_immutable();

-- Canonical payload builder (must stay in sync with server verifier).
CREATE OR REPLACE FUNCTION public.legal_acceptance_payload(a public.legal_acceptances)
RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT 'v1|' || a.id::text || '|' || a.user_id::text || '|' || a.document_version_id::text || '|'
    || a.slug || '|' || a.version::text || '|' || a.content_sha256 || '|' || a.action || '|'
    || replace(coalesce(a.source, '-'), '|', '/') || '|'
    || to_char(a.accepted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') || '|'
    || coalesce(a.ip_address::text, '-') || '|' || coalesce(a.ip_source, '-') || '|'
    || replace(coalesce(a.user_agent, '-'), '|', '/');
$fn$;

-- Append one acceptance to the chain, serialized by a transaction advisory lock.
CREATE OR REPLACE FUNCTION public.append_legal_chain(_acceptance_id uuid)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  a public.legal_acceptances%ROWTYPE;
  _payload text;
  _record_hash text;
  _prev_hash text;
  _chain_hash text;
  _seq bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(727001);

  SELECT * INTO a FROM public.legal_acceptances WHERE id = _acceptance_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'acceptance % not found', _acceptance_id; END IF;
  IF EXISTS (SELECT 1 FROM public.legal_acceptance_chain WHERE acceptance_id = _acceptance_id) THEN
    SELECT seq INTO _seq FROM public.legal_acceptance_chain WHERE acceptance_id = _acceptance_id;
    RETURN _seq;
  END IF;

  _payload := public.legal_acceptance_payload(a);
  _record_hash := encode(extensions.digest(_payload, 'sha256'), 'hex');

  SELECT chain_hash INTO _prev_hash FROM public.legal_acceptance_chain ORDER BY seq DESC LIMIT 1;
  IF _prev_hash IS NULL THEN
    _prev_hash := 'GENESIS:' || encode(extensions.digest('fanaticamente-legal-chain-genesis-v1', 'sha256'), 'hex');
  END IF;

  _chain_hash := encode(extensions.digest(_record_hash || '|' || _prev_hash, 'sha256'), 'hex');

  INSERT INTO public.legal_acceptance_chain
    (acceptance_id, record_payload, record_hash, prev_hash, chain_hash, document_version_id)
  VALUES (a.id, _payload, _record_hash, _prev_hash, _chain_hash, a.document_version_id)
  RETURNING seq INTO _seq;

  -- Pending external timestamp anchor for this record (stamped asynchronously).
  INSERT INTO public.legal_chain_anchors (anchor_type, target_hash, chain_head_seq)
  VALUES ('acceptance', _chain_hash, _seq);

  RETURN _seq;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.legal_acceptance_chain_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  PERFORM public.append_legal_chain(NEW.id);
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER legal_acceptance_chain_after_insert
  AFTER INSERT ON public.legal_acceptances
  FOR EACH ROW EXECUTE FUNCTION public.legal_acceptance_chain_trigger();

-- ============ 2. External timestamp anchors (RFC 3161) ============
CREATE TABLE public.legal_chain_anchors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_type text NOT NULL CHECK (anchor_type IN ('acceptance', 'chain_head', 'report_manifest')),
  target_hash text NOT NULL,
  chain_head_seq bigint,
  report_id text,
  tsa_url text,
  tsa_token bytea,
  tsa_gen_time timestamptz,
  tsa_serial text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'stamped', 'failed')),
  error text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  stamped_at timestamptz
);

COMMENT ON TABLE public.legal_chain_anchors IS 'RFC 3161 trusted timestamp anchors for chain hashes and report manifests. Tokens are stored raw and never modified once stamped.';

CREATE INDEX legal_chain_anchors_status_idx ON public.legal_chain_anchors (status) WHERE status <> 'stamped';
CREATE INDEX legal_chain_anchors_report_idx ON public.legal_chain_anchors (report_id) WHERE report_id IS NOT NULL;

GRANT ALL ON public.legal_chain_anchors TO service_role;
ALTER TABLE public.legal_chain_anchors ENABLE ROW LEVEL SECURITY;

-- Once stamped, the token/target are frozen; only status transitions and retry
-- counters may change, and only from pending/failed to stamped/failed.
CREATE OR REPLACE FUNCTION public.legal_anchor_protect()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
    RAISE EXCEPTION 'legal_chain_anchors is append-only: % not allowed', TG_OP;
  END IF;
  IF OLD.status = 'stamped' THEN
    RAISE EXCEPTION 'stamped anchors are immutable';
  END IF;
  IF NEW.target_hash IS DISTINCT FROM OLD.target_hash
     OR NEW.anchor_type IS DISTINCT FROM OLD.anchor_type
     OR NEW.report_id IS DISTINCT FROM OLD.report_id THEN
    RAISE EXCEPTION 'anchor target fields are immutable';
  END IF;
  IF OLD.tsa_token IS NOT NULL AND NEW.tsa_token IS DISTINCT FROM OLD.tsa_token THEN
    RAISE EXCEPTION 'tsa_token cannot be replaced';
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER legal_anchor_no_delete BEFORE DELETE ON public.legal_chain_anchors
  FOR EACH ROW EXECUTE FUNCTION public.legal_anchor_protect();
CREATE TRIGGER legal_anchor_no_truncate BEFORE TRUNCATE ON public.legal_chain_anchors
  FOR EACH STATEMENT EXECUTE FUNCTION public.legal_anchor_protect();
CREATE TRIGGER legal_anchor_guard_update BEFORE UPDATE ON public.legal_chain_anchors
  FOR EACH ROW EXECUTE FUNCTION public.legal_anchor_protect();

-- ============ 3. Backfill: existing acceptances join the chain in order ============
DO $do$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.legal_acceptances ORDER BY accepted_at, id LOOP
    PERFORM public.append_legal_chain(r.id);
  END LOOP;
END;
$do$;