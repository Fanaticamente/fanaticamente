CREATE OR REPLACE FUNCTION public.admin_legal_report_rows(_ids uuid[] DEFAULT NULL, _offset integer DEFAULT 0, _limit integer DEFAULT 1000)
RETURNS TABLE(id uuid, user_id uuid, full_name text, email text, slug text, version integer, content_sha256 text, action text, source text, ip_address text, user_agent text, accepted_at timestamptz, document_version_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  SELECT la.id, la.user_id, p.full_name, u.email::text, la.slug, la.version, la.content_sha256, la.action, la.source, la.ip_address, la.user_agent, la.accepted_at, la.document_version_id
  FROM public.legal_acceptances la
  LEFT JOIN public.profiles p ON p.user_id = la.user_id
  LEFT JOIN auth.users u ON u.id = la.user_id
  WHERE _ids IS NULL OR la.id = ANY(_ids)
  ORDER BY la.accepted_at DESC
  OFFSET _offset LIMIT _limit;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_legal_report_rows(uuid[], integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_legal_report_rows(uuid[], integer, integer) TO service_role;