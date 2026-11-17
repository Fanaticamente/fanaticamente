CREATE TABLE public.native_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('ios','android')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_error text
);
CREATE INDEX native_push_tokens_user_idx ON public.native_push_tokens(user_id);

GRANT SELECT, DELETE ON public.native_push_tokens TO authenticated;
GRANT ALL ON public.native_push_tokens TO service_role;

ALTER TABLE public.native_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own native tokens" ON public.native_push_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own native tokens" ON public.native_push_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER native_push_tokens_updated_at BEFORE UPDATE ON public.native_push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();