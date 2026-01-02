-- Allow professionals to read their own professional record even if not active yet
CREATE POLICY "Professionals can view own profile"
ON public.professionals
FOR SELECT
USING (auth.uid() = user_id);

-- (Optional safety) Allow admins already have ALL policy; no change needed
