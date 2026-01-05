-- Add receipt_url column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN receipt_url TEXT NULL;

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for payment-receipts bucket

-- Users can upload their own receipts (folder is their user_id)
CREATE POLICY "Users can upload payment receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own receipts
CREATE POLICY "Users can view own receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Professionals can view receipts of their appointments
CREATE POLICY "Professionals can view appointment receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-receipts' 
  AND EXISTS (
    SELECT 1 FROM appointments a
    JOIN professionals p ON p.id = a.professional_id
    WHERE p.user_id = auth.uid()
    AND a.receipt_url LIKE '%' || storage.filename(name)
  )
);