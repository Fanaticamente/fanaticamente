-- Recriar VIEW com campos públicos adicionais (CRP e degree são públicos, não são sensíveis)
DROP VIEW IF EXISTS public.professionals_public;

CREATE VIEW public.professionals_public
WITH (security_invoker = on) AS
SELECT 
  p.id,
  p.user_id,
  p.crp,  -- Número de registro é público (mostrado no perfil)
  p.degree,  -- Formação é pública
  p.bio,
  p.location,
  p.specialties,
  p.experience_years,
  p.hourly_rate,
  p.is_verified,
  p.is_active,
  p.approval_status,
  p.google_calendar_url,
  p.created_at,
  p.updated_at
  -- Campos SENSÍVEIS não incluídos:
  -- document_type, document_number (CPF/CNPJ)
  -- pix_key, pix_key_type
  -- stripe_account_id, stripe_account_status
  -- crp_document_front_url, crp_document_back_url
  -- degree_document_front_url, degree_document_back_url
  -- rejection_reason
  -- subscription_type, subscription_expires_at
FROM public.professionals p
WHERE p.is_active = true;

COMMENT ON VIEW public.professionals_public IS 'View pública segura - não expõe dados sensíveis como CPF, PIX, documentos';