CREATE POLICY "Marketing can manage modules"
ON public.app_modules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'marketing'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'marketing'::app_role));