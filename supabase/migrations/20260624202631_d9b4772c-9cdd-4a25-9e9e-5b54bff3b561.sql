DROP VIEW IF EXISTS public.professionals_public;

CREATE VIEW public.professionals_public
WITH (security_invoker = true)
AS
SELECT * FROM public.get_public_professionals();

GRANT SELECT ON public.professionals_public TO anon;
GRANT SELECT ON public.professionals_public TO authenticated;
GRANT ALL ON public.professionals_public TO service_role;

COMMENT ON VIEW public.professionals_public IS 'Public view of approved active professionals exposing only safe listing fields via get_public_professionals().';