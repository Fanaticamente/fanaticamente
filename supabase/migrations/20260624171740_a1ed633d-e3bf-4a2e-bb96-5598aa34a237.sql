
-- 1. professionals: drop unauthenticated public SELECT (sensitive PIX/doc cols)
DROP POLICY IF EXISTS "Anyone can view active approved professionals" ON public.professionals;

-- 2. profiles: drop unauthenticated public SELECT
DROP POLICY IF EXISTS "Anyone can view profiles of active professionals" ON public.profiles;
-- Re-add restricted to authenticated users only
CREATE POLICY "Authenticated can view profiles of active professionals"
ON public.profiles FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.professionals p
  WHERE p.user_id = profiles.user_id AND p.is_active = true
));

-- 3. session_receipts: drop overly-broad public SELECT
DROP POLICY IF EXISTS "Anyone can verify receipt by number" ON public.session_receipts;

-- Safe verification RPC: returns only non-sensitive fields by receipt number
CREATE OR REPLACE FUNCTION public.verify_receipt_by_number(p_receipt_number bigint)
RETURNS TABLE(
  receipt_number bigint,
  created_at timestamptz,
  professional_name text,
  professional_crp text,
  service_description text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.receipt_number,
    sr.created_at,
    (sr.receipt_data->'professional'->>'full_name')::text AS professional_name,
    (sr.receipt_data->'professional'->>'crp')::text AS professional_crp,
    (sr.receipt_data->'service'->>'description')::text AS service_description
  FROM public.session_receipts sr
  WHERE sr.receipt_number = p_receipt_number
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.verify_receipt_by_number(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_receipt_by_number(bigint) TO anon, authenticated;

-- 4. user_notifications: restrict INSERT to service_role only
DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;
CREATE POLICY "Service role can insert notifications"
ON public.user_notifications FOR INSERT TO service_role
WITH CHECK (true);

-- 5. avatars storage: ownership check on UPDATE / DELETE / INSERT
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid())::text = split_part(storage.filename(name), '.', 1)
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = split_part(storage.filename(name), '.', 1)
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid())::text = split_part(storage.filename(name), '.', 1)
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = split_part(storage.filename(name), '.', 1)
);

-- 6. Public buckets: drop broad SELECT that allows listing (files still served via CDN public URL)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view module images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read health-news images" ON storage.objects;

-- 7. pgmq helper functions: set search_path and restrict EXECUTE to service_role
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 8. Lock down other SECURITY DEFINER functions that don't need anon/public access
REVOKE ALL ON FUNCTION public.get_ranking_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ranking_counts() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_professionals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_professionals() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.emit_appointment_event() FROM PUBLIC, anon, authenticated;
