CREATE TABLE public.quiz_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  image_url text,
  has_topics boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.quiz_categories(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, key)
);

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.quiz_categories(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES public.quiz_topics(id) ON DELETE CASCADE,
  scenario text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quiz_categories TO anon;
GRANT SELECT ON public.quiz_topics TO anon;
GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_topics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_categories TO service_role;
GRANT ALL ON public.quiz_topics TO service_role;
GRANT ALL ON public.quiz_questions TO service_role;

ALTER TABLE public.quiz_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read quiz categories" ON public.quiz_categories FOR SELECT USING (true);
CREATE POLICY "Public can read quiz topics" ON public.quiz_topics FOR SELECT USING (true);
CREATE POLICY "Public can read quiz questions" ON public.quiz_questions FOR SELECT USING (true);

CREATE POLICY "Devs manage quiz categories" ON public.quiz_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'developer') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Devs manage quiz topics" ON public.quiz_topics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'developer') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Devs manage quiz questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'developer') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER quiz_categories_updated_at BEFORE UPDATE ON public.quiz_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER quiz_topics_updated_at BEFORE UPDATE ON public.quiz_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();