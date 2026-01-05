-- Adicionar política para permitir que qualquer pessoa veja perfis de profissionais ativos
CREATE POLICY "Anyone can view profiles of active professionals"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.user_id = profiles.user_id 
    AND p.is_active = true
  )
);