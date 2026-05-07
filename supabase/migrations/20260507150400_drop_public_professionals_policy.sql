-- Drop overly permissive SELECT policy on professionals exposing sensitive fields
-- Public access should go through professionals_public view / get_public_professionals()
DROP POLICY IF EXISTS "Anyone can view active approved professionals" ON public.professionals;
