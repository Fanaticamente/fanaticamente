-- Corrigir usuários cadastrados como "Torcedor" mas que se inscreveram como profissionais
-- Lucas Almeida Ribeiro e Matheus teste

-- 1. Atualizar role de "user" para "professional"
UPDATE public.user_roles
SET role = 'professional'
WHERE user_id IN (
  '019a473b-ac4d-4073-81b3-057e014e61a7',
  '8780d446-6342-4b16-a3ca-4bf48312cf75'
);

-- 2. Criar registro em professionals (caso não exista)
INSERT INTO public.professionals (user_id, is_active, is_verified, approval_status)
SELECT user_id, false, false, 'pending_approval'
FROM (VALUES 
  ('019a473b-ac4d-4073-81b3-057e014e61a7'::uuid),
  ('8780d446-6342-4b16-a3ca-4bf48312cf75'::uuid)
) AS v(user_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.professionals p WHERE p.user_id = v.user_id
);