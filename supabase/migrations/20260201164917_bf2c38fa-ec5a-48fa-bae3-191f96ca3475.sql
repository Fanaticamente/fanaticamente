-- Fix: Remove dangerous SELECT policy that exposes sensitive professional data to all authenticated users
-- The professionals_public view already provides safe public access, so direct table SELECT is not needed

-- Step 1: Drop the dangerous policy that exposes all columns including sensitive data
DROP POLICY IF EXISTS "Authenticated users can view active professionals basic info" ON public.professionals;

-- Step 2: Recreate the professionals_public view with security_definer to bypass RLS safely
-- This ensures the view can access the underlying table while users cannot access it directly
DROP VIEW IF EXISTS public.professionals_public;

CREATE VIEW public.professionals_public
WITH (security_barrier = true) AS
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

-- Grant SELECT on the view to authenticated and anonymous users
GRANT SELECT ON public.professionals_public TO authenticated;
GRANT SELECT ON public.professionals_public TO anon;

-- Add comment explaining the security design
COMMENT ON VIEW public.professionals_public IS 'Public view of professionals that exposes only non-sensitive fields. Sensitive data like document_number, pix_key, stripe_account_id, and document URLs are excluded for privacy.';