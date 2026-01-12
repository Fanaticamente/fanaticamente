-- Tabela para Notas Clínicas Pessoais
CREATE TABLE public.clinical_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_code TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Mapa de Observação Clínica
CREATE TABLE public.clinical_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_code TEXT NOT NULL,
  recurring_themes TEXT,
  observed_emotions TEXT,
  trigger_situations TEXT,
  patient_resources TEXT,
  attention_points TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Plano Terapêutico Pessoal
CREATE TABLE public.therapeutic_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_code TEXT NOT NULL,
  general_objectives TEXT,
  strategies TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Revisão de Caso (Auto-supervisão)
CREATE TABLE public.case_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_code TEXT NOT NULL,
  whats_working TEXT,
  difficulties TEXT,
  feelings TEXT,
  needs_supervision BOOLEAN DEFAULT false,
  supervision_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para Biblioteca de Referências
CREATE TABLE public.reference_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link TEXT,
  notes TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapeutic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Apenas o profissional dono pode acessar
CREATE POLICY "Professionals can manage own clinical notes"
ON public.clinical_notes FOR ALL
USING (EXISTS (SELECT 1 FROM professionals p WHERE p.id = clinical_notes.professional_id AND p.user_id = auth.uid()));

CREATE POLICY "Professionals can manage own clinical observations"
ON public.clinical_observations FOR ALL
USING (EXISTS (SELECT 1 FROM professionals p WHERE p.id = clinical_observations.professional_id AND p.user_id = auth.uid()));

CREATE POLICY "Professionals can manage own therapeutic plans"
ON public.therapeutic_plans FOR ALL
USING (EXISTS (SELECT 1 FROM professionals p WHERE p.id = therapeutic_plans.professional_id AND p.user_id = auth.uid()));

CREATE POLICY "Professionals can manage own case reviews"
ON public.case_reviews FOR ALL
USING (EXISTS (SELECT 1 FROM professionals p WHERE p.id = case_reviews.professional_id AND p.user_id = auth.uid()));

CREATE POLICY "Professionals can manage own reference library"
ON public.reference_library FOR ALL
USING (EXISTS (SELECT 1 FROM professionals p WHERE p.id = reference_library.professional_id AND p.user_id = auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON public.clinical_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinical_observations_updated_at BEFORE UPDATE ON public.clinical_observations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_therapeutic_plans_updated_at BEFORE UPDATE ON public.therapeutic_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_case_reviews_updated_at BEFORE UPDATE ON public.case_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reference_library_updated_at BEFORE UPDATE ON public.reference_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();