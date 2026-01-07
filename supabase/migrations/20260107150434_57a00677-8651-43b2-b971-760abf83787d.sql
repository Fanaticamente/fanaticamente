-- Add fields to appointments table for rejection/refund flow
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS user_pix_key text,
ADD COLUMN IF NOT EXISTS user_pix_key_type text,
ADD COLUMN IF NOT EXISTS refund_receipt_url text,
ADD COLUMN IF NOT EXISTS refund_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS refund_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dispute_reason text,
ADD COLUMN IF NOT EXISTS dispute_created_at timestamp with time zone;

-- Create disputes table for admin management
CREATE TABLE IF NOT EXISTS public.appointment_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on disputes table
ALTER TABLE public.appointment_disputes ENABLE ROW LEVEL SECURITY;

-- RLS policies for disputes
CREATE POLICY "Users can view own disputes"
ON public.appointment_disputes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Professionals can view their disputes"
ON public.appointment_disputes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM professionals p
  WHERE p.id = appointment_disputes.professional_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can create disputes"
ON public.appointment_disputes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all disputes"
ON public.appointment_disputes
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add trigger to update updated_at
CREATE TRIGGER update_appointment_disputes_updated_at
BEFORE UPDATE ON public.appointment_disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for disputes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_disputes;