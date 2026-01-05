-- Add Stripe Connect account ID to professionals table
ALTER TABLE public.professionals 
ADD COLUMN stripe_account_id TEXT DEFAULT NULL,
ADD COLUMN stripe_account_status TEXT DEFAULT 'pending';