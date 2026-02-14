
-- Add socio_consciente flag to professionals table
ALTER TABLE public.professionals ADD COLUMN socio_consciente boolean NOT NULL DEFAULT false;
