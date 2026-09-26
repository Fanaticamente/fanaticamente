ALTER TABLE public.professionals
  ADD COLUMN marketplace_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN deleted_at timestamp with time zone;

COMMENT ON COLUMN public.professionals.marketplace_visible IS 'Admin-controlled visibility of an approved professional in the public marketplace.';
COMMENT ON COLUMN public.professionals.deleted_at IS 'Soft-deletion timestamp. Null means the professional record is active in the system.';

CREATE OR REPLACE FUNCTION public.protect_professional_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role)
     AND (
       NEW.marketplace_visible IS DISTINCT FROM OLD.marketplace_visible
       OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
     ) THEN
    RAISE EXCEPTION 'Only administrators can change marketplace visibility or archive status';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_professional_admin_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.protect_professional_admin_fields() TO service_role;

CREATE TRIGGER protect_professional_admin_fields_trigger
BEFORE UPDATE ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.protect_professional_admin_fields();

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
SET search_path = public
AS $$
  SELECT
    p.id, p.user_id, p.crp, p.degree, p.bio, p.location, p.specialties,
    p.experience_years, p.hourly_rate, p.is_verified, p.is_active,
    p.approval_status, p.google_calendar_url, p.socio_consciente,
    p.created_at, p.updated_at,
    pr.full_name, pr.avatar_url, pr.favorite_club_id
  FROM public.professionals p
  LEFT JOIN public.profiles pr ON pr.user_id = p.user_id
  WHERE p.is_active = true
    AND p.approval_status = 'approved'
    AND p.marketplace_visible = true
    AND p.deleted_at IS NULL
  ORDER BY p.created_at ASC, p.id ASC;
$$;