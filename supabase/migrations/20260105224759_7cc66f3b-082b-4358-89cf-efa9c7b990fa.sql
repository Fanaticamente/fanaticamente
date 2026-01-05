-- Add approval workflow columns to professionals table
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending_payment',
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS crp_document_front_url text,
ADD COLUMN IF NOT EXISTS crp_document_back_url text;

-- Create admin_messages table for internal communication
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  admin_user_id uuid NOT NULL,
  message text NOT NULL,
  message_type text DEFAULT 'info', -- info, warning, alert, approval, rejection
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on admin_messages
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Professionals can view messages sent to them
CREATE POLICY "Professionals can view own messages"
ON public.admin_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM professionals p
    WHERE p.id = admin_messages.professional_id
    AND p.user_id = auth.uid()
  )
);

-- Professionals can mark messages as read
CREATE POLICY "Professionals can update own messages"
ON public.admin_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM professionals p
    WHERE p.id = admin_messages.professional_id
    AND p.user_id = auth.uid()
  )
);

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages"
ON public.admin_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for CRP documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('crp-documents', 'crp-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Professionals can upload their own CRP documents
CREATE POLICY "Professionals can upload own CRP documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'crp-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Professionals can view their own CRP documents
CREATE POLICY "Professionals can view own CRP documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'crp-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all CRP documents
CREATE POLICY "Admins can view all CRP documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'crp-documents' 
  AND has_role(auth.uid(), 'admin')
);

-- Professionals can update their own CRP documents
CREATE POLICY "Professionals can update own CRP documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'crp-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Professionals can delete their own CRP documents
CREATE POLICY "Professionals can delete own CRP documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'crp-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Comment on new columns
COMMENT ON COLUMN public.professionals.approval_status IS 'Status: pending_payment, pending_approval, approved, rejected, needs_correction';
COMMENT ON COLUMN public.professionals.rejection_reason IS 'Reason for rejection if status is rejected or needs_correction';
COMMENT ON COLUMN public.professionals.crp_document_front_url IS 'URL of front of CRP ID card';
COMMENT ON COLUMN public.professionals.crp_document_back_url IS 'URL of back of CRP ID card';