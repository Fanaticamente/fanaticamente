-- Allow professionals to view profiles of users who have appointments with them
CREATE POLICY "Professionals can view profiles of their patients"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM appointments a
    INNER JOIN professionals p ON p.id = a.professional_id
    WHERE a.user_id = profiles.user_id
    AND p.user_id = auth.uid()
  )
);