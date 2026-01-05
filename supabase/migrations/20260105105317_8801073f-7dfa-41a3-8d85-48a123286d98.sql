-- Add consultation_link to appointments for professionals to share meeting links
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS consultation_link text;

-- Add document_type and document_number to professionals for CPF/CNPJ
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS document_type text CHECK (document_type IN ('cpf', 'cnpj'));
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS document_number text;