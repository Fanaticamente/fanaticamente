-- Add rating column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Add index for better performance when calculating average ratings
CREATE INDEX IF NOT EXISTS idx_appointments_rating ON public.appointments(professional_id, rating) WHERE rating IS NOT NULL;