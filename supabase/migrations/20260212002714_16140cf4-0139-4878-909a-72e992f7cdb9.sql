
-- Table for monthly membership subscriptions (R$49,90/month)
CREATE TABLE public.user_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  payment_method TEXT,
  mercadopago_payment_id TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships"
ON public.user_memberships FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage memberships"
ON public.user_memberships FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add payment tracking to user_course_access
ALTER TABLE public.user_course_access 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_payment_id TEXT;

-- Trigger for updated_at
CREATE TRIGGER update_user_memberships_updated_at
BEFORE UPDATE ON public.user_memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
