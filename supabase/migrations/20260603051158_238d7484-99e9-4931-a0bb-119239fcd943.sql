CREATE POLICY "Users can view refund receipts of their appointments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-receipts'
  AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.user_id = auth.uid()
      AND a.refund_receipt_url = storage.objects.name
  )
);