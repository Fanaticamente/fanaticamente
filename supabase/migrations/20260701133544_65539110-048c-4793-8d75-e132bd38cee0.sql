
CREATE TABLE public.legal_documents (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.legal_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read legal documents"
  ON public.legal_documents FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert legal documents"
  ON public.legal_documents FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update legal documents"
  ON public.legal_documents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete legal documents"
  ON public.legal_documents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.legal_documents (slug, title, content_html) VALUES
  ('privacy-policy', 'Política de Privacidade', ''),
  ('terms-of-use', 'Termos de Uso', '')
ON CONFLICT (slug) DO NOTHING;
