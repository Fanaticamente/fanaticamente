ALTER TABLE public.legal_acceptances ADD COLUMN IF NOT EXISTS ip_source text;
ALTER TABLE public.legal_signup_intents ADD COLUMN IF NOT EXISTS ip_source text;
COMMENT ON COLUMN public.legal_acceptances.ip_source IS 'Technical origin of ip_address: sb-forwarded-for (set by platform edge, overwrites client value) or unavailable. NULL = recorded before this column existed.';
COMMENT ON COLUMN public.legal_signup_intents.ip_source IS 'Technical origin of ip_address; see legal_acceptances.ip_source.';