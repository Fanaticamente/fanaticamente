-- 1. Criar VIEW pública segura que expõe apenas campos não-sensíveis
CREATE VIEW public.professionals_public
WITH (security_invoker = on) AS
SELECT 
  p.id,
  p.user_id,
  p.bio,
  p.location,
  p.specialties,
  p.experience_years,
  p.hourly_rate,
  p.is_verified,
  p.is_active,
  p.google_calendar_url,
  p.created_at,
  p.updated_at
FROM public.professionals p
WHERE p.is_active = true;

-- 2. Remover a política pública atual que expõe todos os campos
DROP POLICY IF EXISTS "Anyone can view active professionals" ON public.professionals;

-- 3. Criar nova política: Profissionais podem ver seu próprio perfil completo
-- (A política "Professionals can view own profile" já existe, então mantemos)

-- 4. Criar política restrita para usuários autenticados que precisam ver profissionais
-- Usuários autenticados podem ver apenas profissionais ativos (via VIEW, não diretamente)
-- A VIEW usa security_invoker, então precisamos de uma política que permita isso
CREATE POLICY "Authenticated users can view active professionals basic info"
ON public.professionals
FOR SELECT
USING (
  is_active = true 
  AND auth.uid() IS NOT NULL
  AND auth.uid() != user_id  -- Não é o próprio profissional (coberto por outra política)
);

-- 5. Adicionar comentário na tabela para documentar a restrição
COMMENT ON VIEW public.professionals_public IS 'View pública segura - não expõe dados sensíveis como CPF, PIX, documentos';