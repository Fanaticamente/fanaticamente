-- Limpar todas as disponibilidades existentes (baseadas em datas específicas)
TRUNCATE TABLE public.professional_availability;

-- Criar nova tabela para disponibilidade semanal (por dia da semana)
CREATE TABLE public.professional_weekly_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo, 1 = Segunda, etc.
  time_slots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, day_of_week)
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.professional_weekly_availability ENABLE ROW LEVEL SECURITY;

-- Policies para a nova tabela
CREATE POLICY "Anyone can view weekly availability"
  ON public.professional_weekly_availability
  FOR SELECT
  USING (true);

CREATE POLICY "Professionals can manage own weekly availability"
  ON public.professional_weekly_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM professionals p
      WHERE p.id = professional_weekly_availability.professional_id
      AND p.user_id = auth.uid()
    )
  );

-- Adicionar campo para link do Google Calendar na tabela professionals
ALTER TABLE public.professionals 
ADD COLUMN google_calendar_url TEXT DEFAULT NULL;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_weekly_availability_updated_at
  BEFORE UPDATE ON public.professional_weekly_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();