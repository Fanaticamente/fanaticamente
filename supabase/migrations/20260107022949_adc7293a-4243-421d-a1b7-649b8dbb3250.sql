-- Add columns for degree/diploma document uploads
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS degree_document_front_url TEXT,
ADD COLUMN IF NOT EXISTS degree_document_back_url TEXT;