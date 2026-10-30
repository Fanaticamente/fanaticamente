-- Immutable versions of legal documents
CREATE TABLE public.legal_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL REFERENCES public.legal_documents(slug),
  version integer NOT NULL,
  title text NOT NULL,
  content_html text NOT NULL,
  content_sha256 text NOT NULL,
  requires_reacceptance boolean NOT NULL DEFAULT false,
  change_summary text,
  published_by uuid,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, version)
);
GRANT SELECT ON public.legal_document_versions TO anon, authenticated;
GRANT ALL ON public.legal_document_versions TO service_role;
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read legal document versions" ON public.legal_document_versions FOR SELECT USING (true);

-- Acceptance evidence
CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_version_id uuid NOT NULL REFERENCES public.legal_document_versions(id),
  slug text NOT NULL,
  version integer NOT NULL,
  content_sha256 text NOT NULL,
  action text NOT NULL CHECK (action IN ('accept','reaccept')),
  source text NOT NULL CHECK (source IN ('signup','reaccept_prompt')),
  ip_address text,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX legal_acceptances_user_idx ON public.legal_acceptances(user_id, accepted_at DESC);
GRANT SELECT ON public.legal_acceptances TO authenticated;
GRANT ALL ON public.legal_acceptances TO service_role;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own acceptances" ON public.legal_acceptances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all acceptances" ON public.legal_acceptances FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Server-side hash + version numbering
CREATE OR REPLACE FUNCTION public.legal_version_before_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.content_sha256 := encode(sha256(convert_to(NEW.content_html, 'UTF8')), 'hex');
  NEW.published_at := now();
  SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version FROM public.legal_document_versions WHERE slug = NEW.slug;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_legal_version_before_insert BEFORE INSERT ON public.legal_document_versions
FOR EACH ROW EXECUTE FUNCTION public.legal_version_before_insert();

-- Immutability
CREATE OR REPLACE FUNCTION public.legal_block_mutation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Only allowed change: retention purge that clears technical data
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'legal_acceptances'
     AND NEW.ip_address IS NULL AND NEW.user_agent IS NULL
     AND (to_jsonb(NEW) - 'ip_address' - 'user_agent') = (to_jsonb(OLD) - 'ip_address' - 'user_agent') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Legal evidence records are immutable (% on %)', TG_OP, TG_TABLE_NAME;
END $$;
CREATE TRIGGER trg_legal_versions_immutable BEFORE UPDATE OR DELETE ON public.legal_document_versions
FOR EACH ROW EXECUTE FUNCTION public.legal_block_mutation();
CREATE TRIGGER trg_legal_acceptances_immutable BEFORE UPDATE OR DELETE ON public.legal_acceptances
FOR EACH ROW EXECUTE FUNCTION public.legal_block_mutation();

-- Every content change on legal_documents produces a version (history never lost)
CREATE OR REPLACE FUNCTION public.legal_documents_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE last_content text;
BEGIN
  SELECT content_html INTO last_content FROM public.legal_document_versions
   WHERE slug = NEW.slug ORDER BY version DESC LIMIT 1;
  IF last_content IS DISTINCT FROM NEW.content_html THEN
    INSERT INTO public.legal_document_versions (slug, title, content_html, content_sha256, version, requires_reacceptance, published_by, change_summary)
    VALUES (NEW.slug, NEW.title, NEW.content_html, '', 0, false, auth.uid(), 'Edição direta');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_legal_documents_snapshot AFTER INSERT OR UPDATE ON public.legal_documents
FOR EACH ROW EXECUTE FUNCTION public.legal_documents_snapshot();

-- Seed version 1 of current documents (requires acceptance)
INSERT INTO public.legal_document_versions (slug, title, content_html, content_sha256, version, requires_reacceptance, change_summary)
SELECT slug, title, content_html, '', 0, true, 'Versão inicial registrada' FROM public.legal_documents;

-- Controlled publication (admin only)
CREATE OR REPLACE FUNCTION public.publish_legal_document_version(_slug text, _content_html text, _requires_reacceptance boolean, _change_summary text)
RETURNS public.legal_document_versions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.legal_document_versions; t text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF length(coalesce(_content_html,'')) < 20 THEN RAISE EXCEPTION 'Conteúdo vazio'; END IF;
  SELECT title INTO t FROM public.legal_documents WHERE slug = _slug;
  IF t IS NULL THEN RAISE EXCEPTION 'Documento inexistente'; END IF;
  INSERT INTO public.legal_document_versions (slug, title, content_html, content_sha256, version, requires_reacceptance, published_by, change_summary)
  VALUES (_slug, t, _content_html, '', 0, coalesce(_requires_reacceptance,false), auth.uid(), left(_change_summary, 500))
  RETURNING * INTO v;
  UPDATE public.legal_documents SET content_html = _content_html, updated_at = now() WHERE slug = _slug;
  RETURN v;
END $$;
REVOKE ALL ON FUNCTION public.publish_legal_document_version(text,text,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_legal_document_version(text,text,boolean,text) TO authenticated;

-- Documents the current user still needs to accept
CREATE OR REPLACE FUNCTION public.get_pending_legal_documents(_user_id uuid DEFAULT NULL)
RETURNS TABLE(slug text, title text, version_id uuid, version integer, content_sha256 text, previously_accepted boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH me AS (SELECT CASE WHEN auth.role() = 'service_role' THEN _user_id ELSE auth.uid() END AS uid),
  needed AS (
    SELECT s FROM me, unnest(ARRAY['terms-of-use','privacy-policy']) s WHERE public.has_role(me.uid, 'user'::app_role)
    UNION
    SELECT s FROM me, unnest(ARRAY['terms-of-use-professional','privacy-policy-professional']) s WHERE public.has_role(me.uid, 'professional'::app_role)
  ),
  cur AS (
    SELECT DISTINCT ON (v.slug) v.* FROM public.legal_document_versions v JOIN needed n ON n.s = v.slug
    ORDER BY v.slug, v.version DESC
  ),
  minv AS (
    SELECT slug, COALESCE(MAX(version) FILTER (WHERE requires_reacceptance), 1) AS min_version
    FROM public.legal_document_versions GROUP BY slug
  )
  SELECT c.slug, c.title, c.id, c.version, c.content_sha256,
         EXISTS (SELECT 1 FROM public.legal_acceptances a, me WHERE a.user_id = me.uid AND a.slug = c.slug)
  FROM cur c JOIN minv m ON m.slug = c.slug, me
  WHERE me.uid IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.legal_acceptances a WHERE a.user_id = me.uid AND a.slug = c.slug AND a.version >= m.min_version);
$$;
REVOKE ALL ON FUNCTION public.get_pending_legal_documents(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_legal_documents(uuid) TO authenticated, service_role;

-- Admin search
CREATE OR REPLACE FUNCTION public.admin_search_legal_acceptances(_query text DEFAULT '')
RETURNS TABLE(id uuid, user_id uuid, full_name text, email text, slug text, version integer, content_sha256 text,
  action text, source text, ip_address text, user_agent text, accepted_at timestamptz, document_version_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT a.id, a.user_id, p.full_name, u.email::text, a.slug, a.version, a.content_sha256, a.action, a.source,
         a.ip_address, a.user_agent, a.accepted_at, a.document_version_id
  FROM public.legal_acceptances a
  LEFT JOIN public.profiles p ON p.user_id = a.user_id
  LEFT JOIN auth.users u ON u.id = a.user_id
  WHERE coalesce(_query,'') = ''
     OR a.user_id::text = _query
     OR p.full_name ILIKE '%' || _query || '%'
     OR u.email ILIKE '%' || _query || '%'
  ORDER BY a.accepted_at DESC
  LIMIT 500;
END $$;
REVOKE ALL ON FUNCTION public.admin_search_legal_acceptances(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_search_legal_acceptances(text) TO authenticated;

-- Retention: clear IP/user-agent after 5 years (evidence of version/hash/date kept)
CREATE OR REPLACE FUNCTION public.purge_legal_acceptance_technical_data()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.legal_acceptances SET ip_address = NULL, user_agent = NULL
  WHERE accepted_at < now() - interval '5 years' AND (ip_address IS NOT NULL OR user_agent IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.purge_legal_acceptance_technical_data() FROM PUBLIC, anon, authenticated;
SELECT cron.schedule('purge-legal-acceptance-technical-data', '30 3 * * 0', $c$ SELECT public.purge_legal_acceptance_technical_data(); $c$);