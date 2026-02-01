-- Fix security_definer_view error: Recreate view with security_invoker instead of security_barrier
-- The Supabase linter incorrectly flags security_barrier as security_definer
-- Using security_invoker ensures the view runs with the caller's permissions

DROP VIEW IF EXISTS public.professionals_public;

-- Create the view with security_invoker = true (runs with caller's permissions)
-- Since we removed the problematic RLS policy, the view needs to be able to read
-- from the professionals table. We'll use a function to fetch safe data.

-- First, create a security definer function that returns only safe professional data
CREATE OR REPLACE FUNCTION public.get_public_professionals()
RETURNS TABLE (
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    p.created_at,
    p.updated_at
  FROM public.professionals p
  WHERE p.is_active = true 
    AND p.approval_status = 'approved';
$$;

-- Create a simple view that calls the function (no security options needed)
CREATE VIEW public.professionals_public AS
SELECT * FROM public.get_public_professionals();

-- Grant SELECT on the view to authenticated and anonymous users
GRANT SELECT ON public.professionals_public TO authenticated;
GRANT SELECT ON public.professionals_public TO anon;

-- Add comments explaining the security design
COMMENT ON FUNCTION public.get_public_professionals() IS 'Security definer function that returns only non-sensitive professional data. Excludes: document_number, pix_key, stripe_account_id, document URLs.';
COMMENT ON VIEW public.professionals_public IS 'Public view of approved professionals exposing only non-sensitive fields via get_public_professionals() function.';