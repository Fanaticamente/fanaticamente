-- Allow anyone to view active and approved professionals (needed for marketplace and for profiles RLS subquery)
CREATE POLICY "Anyone can view active approved professionals"
ON public.professionals
FOR SELECT
USING (is_active = true AND approval_status = 'approved');
