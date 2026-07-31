CREATE OR REPLACE FUNCTION public.check_signup_conflict(_email text, _phone text, _account_type text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_email text := lower(trim(coalesce(_email, '')));
  local_part text;
  domain_part text;
  base_local text;
  base_email text;
  tagged_email text;
  clean_phone text := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  is_pro boolean := (_account_type = 'pro');
  email_taken boolean := false;
  phone_taken boolean := false;
BEGIN
  IF position('@' in clean_email) > 1 THEN
    local_part := split_part(clean_email, '@', 1);
    domain_part := split_part(clean_email, '@', 2);
    base_local := split_part(local_part, '+', 1);
    base_email := base_local || '@' || domain_part;
    tagged_email := base_local || '+' || CASE WHEN is_pro THEN 'pro' ELSE 'fan' END || '@' || domain_part;

    SELECT EXISTS (
      SELECT 1 FROM auth.users u
      WHERE lower(u.email) = tagged_email
         OR (
           lower(u.email) = base_email
           AND is_pro = public.has_role(u.id, 'professional'::app_role)
         )
    ) INTO email_taken;
  END IF;

  IF length(clean_phone) >= 10 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') = clean_phone
        AND is_pro = public.has_role(p.user_id, 'professional'::app_role)
    ) INTO phone_taken;
  END IF;

  RETURN jsonb_build_object('email_taken', email_taken, 'phone_taken', phone_taken);
END;
$$;

REVOKE ALL ON FUNCTION public.check_signup_conflict(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_signup_conflict(text, text, text) TO service_role;