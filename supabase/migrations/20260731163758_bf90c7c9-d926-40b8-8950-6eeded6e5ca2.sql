CREATE POLICY "Professionals can create appointments for their patients"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = appointments.professional_id AND p.user_id = auth.uid()
  )
);