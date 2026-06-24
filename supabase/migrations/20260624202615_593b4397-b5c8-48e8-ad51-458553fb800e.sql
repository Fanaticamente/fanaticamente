DROP VIEW IF EXISTS public.professionals_public;
DROP FUNCTION IF EXISTS public.get_public_professionals();

CREATE OR REPLACE FUNCTION public.get_public_professionals()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  crp text,
  degree text,
  bio text,
  location text,
  specialties text[],
  experience_years integer,
  hourly_rate numeric,
  is_verified boolean,
  is_active boolean,
  approval_status text,
  google_calendar_url text,
  socio_consciente boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  favorite_club_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.user_id,
    p.crp,
    p.degree,
    p.bio,
    p.location,
    p.specialties,
    p.experience_years,
    p.hourly_rate,
    p.is_verified,
    p.is_active,
    p.approval_status,
    p.google_calendar_url,
    p.socio_consciente,
    p.created_at,
    p.updated_at,
    pr.full_name,
    pr.avatar_url,
    pr.favorite_club_id
  FROM public.professionals p
  LEFT JOIN public.profiles pr ON pr.user_id = p.user_id
  WHERE p.is_active = true 
    AND p.approval_status = 'approved';
$function$;

CREATE VIEW public.professionals_public
WITH (security_invoker = false)
AS
SELECT * FROM public.get_public_professionals();

GRANT SELECT ON public.professionals_public TO anon;
GRANT SELECT ON public.professionals_public TO authenticated;
GRANT ALL ON public.professionals_public TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_professionals() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_professionals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_professionals() TO service_role;

COMMENT ON FUNCTION public.get_public_professionals() IS 'Security definer function that returns only non-sensitive public professional listing data, including safe profile fields needed for team filtering.';
COMMENT ON VIEW public.professionals_public IS 'Public view of approved active professionals exposing only safe listing fields via get_public_professionals().';