DROP POLICY IF EXISTS "Anyone can view gcal blocks" ON public.google_calendar_blocks;
CREATE POLICY "Professionals view own gcal blocks" ON public.google_calendar_blocks
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = google_calendar_blocks.professional_id AND p.user_id = auth.uid()));