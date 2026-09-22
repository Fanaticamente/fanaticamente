CREATE OR REPLACE FUNCTION public.get_professional_whatsapp(p_professional_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT pr.phone
  FROM public.professionals p
  JOIN public.profiles pr ON pr.user_id = p.user_id
  WHERE p.id = p_professional_id
    AND p.is_active = true
    AND p.approval_status = 'approved'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_professional_whatsapp(uuid) TO anon, authenticated, service_role;