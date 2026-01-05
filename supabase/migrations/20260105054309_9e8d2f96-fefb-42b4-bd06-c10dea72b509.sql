-- Add PIX key field to professionals table
ALTER TABLE public.professionals 
ADD COLUMN pix_key TEXT DEFAULT NULL,
ADD COLUMN pix_key_type TEXT DEFAULT NULL;