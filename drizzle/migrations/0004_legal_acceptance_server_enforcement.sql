-- 1) Centralized check: does the current authenticated user have every required legal document accepted?
CREATE OR REPLACE FUNCTION public.legal_acceptance_ok()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NULL
      OR NOT EXISTS (SELECT 1 FROM public.get_pending_legal_documents(NULL));
$$;
REVOKE ALL ON FUNCTION public.legal_acceptance_ok() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.legal_acceptance_ok() TO anon, authenticated, service_role;

-- 2) Restrictive policies (AND-ed with existing ones; existing policies untouched)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_messages','appointment_disputes','appointments','case_reviews','clinical_notes',
    'clinical_observations','coupon_usage','emotion_entries','emotional_lineups',
    'google_calendar_blocks','match_expectations','professional_availability',
    'professional_google_calendar','professional_weekly_availability','professionals','profiles',
    'push_subscriptions','quiz_completions','receipt_templates','reference_library',
    'session_receipts','therapeutic_plans','user_activity_completion','user_challenge_progress',
    'user_course_access','user_lesson_progress','user_memberships','user_notifications'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Require current legal acceptance" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT public.legal_acceptance_ok())) WITH CHECK ((SELECT public.legal_acceptance_ok()))',
      t);
  END LOOP;
END $$;

CREATE POLICY "Require current legal acceptance for private files"
ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
USING (bucket_id NOT IN ('crp-documents','payment-receipts','osmf-reports','football-media') OR (SELECT public.legal_acceptance_ok()))
WITH CHECK (bucket_id NOT IN ('crp-documents','payment-receipts','osmf-reports','football-media') OR (SELECT public.legal_acceptance_ok()));

-- 3) Server-created signup acceptance intents
CREATE TABLE public.legal_signup_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_sha256 text NOT NULL UNIQUE,
  email_base text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('fan','pro')),
  document_version_ids uuid[] NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  user_id uuid,
  bound_at timestamptz,
  consumed_at timestamptz
);
GRANT ALL ON public.legal_signup_intents TO service_role;
GRANT SELECT ON public.legal_signup_intents TO authenticated;
ALTER TABLE public.legal_signup_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read signup intents" ON public.legal_signup_intents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX legal_signup_intents_user_idx ON public.legal_signup_intents(user_id);
CREATE INDEX legal_signup_intents_email_idx ON public.legal_signup_intents(email_base, created_at);

-- 4) Link acceptances to the intent (nullable; existing rows untouched)
ALTER TABLE public.legal_acceptances ADD COLUMN signup_intent_id uuid REFERENCES public.legal_signup_intents(id);
ALTER TABLE public.legal_acceptances ADD COLUMN intent_recorded_at timestamptz;
CREATE UNIQUE INDEX legal_acceptances_user_version_uniq ON public.legal_acceptances(user_id, document_version_id);

CREATE OR REPLACE FUNCTION public.legal_email_base(_email text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT lower(split_part(split_part(trim(coalesce(_email,'')),'@',1),'+',1) || '@' || split_part(trim(coalesce(_email,'')),'@',2));
$$;

CREATE OR REPLACE FUNCTION public.legal_finalize_signup_intent(_uid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE it public.legal_signup_intents; n integer := 0;
BEGIN
  SELECT * INTO it FROM public.legal_signup_intents
   WHERE user_id = _uid AND consumed_at IS NULL
   ORDER BY bound_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;

  INSERT INTO public.legal_acceptances
    (user_id, document_version_id, slug, version, content_sha256, action, source, ip_address, user_agent, signup_intent_id, intent_recorded_at)
  SELECT _uid, v.id, v.slug, v.version, v.content_sha256,
         CASE WHEN EXISTS (SELECT 1 FROM public.legal_acceptances a WHERE a.user_id = _uid AND a.slug = v.slug) THEN 'reaccept' ELSE 'accept' END,
         'signup', it.ip_address, it.user_agent, it.id, it.created_at
  FROM public.legal_document_versions v
  WHERE v.id = ANY(it.document_version_ids)
    AND v.version = (SELECT max(w.version) FROM public.legal_document_versions w WHERE w.slug = v.slug)
    AND NOT EXISTS (SELECT 1 FROM public.legal_acceptances a WHERE a.user_id = _uid AND a.document_version_id = v.id);
  GET DIAGNOSTICS n = ROW_COUNT;

  UPDATE public.legal_signup_intents SET consumed_at = now() WHERE id = it.id;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.legal_finalize_signup_intent(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.legal_bind_signup_intent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tok text := NEW.raw_user_meta_data ->> 'legal_intent_token';
  acct text := CASE WHEN coalesce(NEW.raw_user_meta_data ->> 'account_type','') = 'pro' THEN 'pro' ELSE 'fan' END;
  iid uuid;
BEGIN
  IF tok IS NULL OR length(tok) < 32 THEN RETURN NEW; END IF;
  UPDATE public.legal_signup_intents
     SET user_id = NEW.id, bound_at = now()
   WHERE token_sha256 = encode(sha256(convert_to(tok, 'UTF8')), 'hex')
     AND user_id IS NULL
     AND expires_at > now()
     AND email_base = public.legal_email_base(NEW.email)
     AND account_type = acct
  RETURNING id INTO iid;
  IF iid IS NOT NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public.legal_finalize_signup_intent(NEW.id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'legal_bind_signup_intent failed: %', SQLERRM;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.legal_bind_signup_intent() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.legal_on_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public.legal_finalize_signup_intent(NEW.id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'legal_on_email_confirmed failed: %', SQLERRM;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.legal_on_email_confirmed() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_legal
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.legal_bind_signup_intent();
CREATE TRIGGER on_auth_user_confirmed_legal
  AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.legal_on_email_confirmed();