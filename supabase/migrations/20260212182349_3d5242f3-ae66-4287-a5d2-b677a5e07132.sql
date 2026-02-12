
-- Table for professional receipt templates
CREATE TABLE public.receipt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  crp TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'CPF',
  document_number TEXT NOT NULL,
  service_description TEXT NOT NULL DEFAULT 'Sessão de Psicoterapia',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id)
);

ALTER TABLE public.receipt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can manage own receipt template"
ON public.receipt_templates FOR ALL
USING (EXISTS (
  SELECT 1 FROM professionals p
  WHERE p.id = receipt_templates.professional_id AND p.user_id = auth.uid()
));

CREATE TRIGGER update_receipt_templates_updated_at
BEFORE UPDATE ON public.receipt_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add CPF column to profiles for patient identification on receipts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Table for generated session receipts
CREATE TABLE public.session_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  user_id UUID NOT NULL,
  receipt_html TEXT NOT NULL,
  receipt_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

ALTER TABLE public.session_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals can insert own receipts"
ON public.session_receipts FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM professionals p
  WHERE p.id = session_receipts.professional_id AND p.user_id = auth.uid()
));

CREATE POLICY "Professionals can view own receipts"
ON public.session_receipts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM professionals p
  WHERE p.id = session_receipts.professional_id AND p.user_id = auth.uid()
));

CREATE POLICY "Users can view own receipts"
ON public.session_receipts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all receipts"
ON public.session_receipts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
