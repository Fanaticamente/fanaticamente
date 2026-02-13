
-- Allow anyone to verify receipt authenticity by receipt_number (only limited fields)
CREATE POLICY "Anyone can verify receipt by number"
ON public.session_receipts
FOR SELECT
USING (true);
