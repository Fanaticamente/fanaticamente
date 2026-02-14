
-- Drop view and function first, then recreate with socio_consciente
DROP VIEW IF EXISTS public.professionals_public;
DROP FUNCTION IF EXISTS public.get_public_professionals();

CREATE VIEW public.professionals_public
WITH (security_invoker = true)
AS
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
  p.updated_at
FROM public.professionals p
WHERE p.is_active = true 
  AND p.approval_status = 'approved';

CREATE FUNCTION public.get_public_professionals()
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
  updated_at timestamp with time zone
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
    p.updated_at
  FROM public.professionals p
  WHERE p.is_active = true 
    AND p.approval_status = 'approved';
$function$;
