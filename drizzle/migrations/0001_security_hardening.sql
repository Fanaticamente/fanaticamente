-- Pin search_path on queue helpers
ALTER FUNCTION public.move_to_dlq(text,text,bigint,jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text,integer,integer) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text,jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text,bigint) SET search_path = public, pgmq;

-- Internal-only functions: no client execution
DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'public.move_to_dlq(text,text,bigint,jsonb)',
    'public.read_email_batch(text,integer,integer)',
    'public.enqueue_email(text,jsonb)',
    'public.delete_email(text,bigint)',
    'public.email_queue_dispatch()',
    'public.email_queue_wake()',
    'public.purge_cron_history()',
    'public.purge_operational_logs()',
    'public.refresh_ranking_snapshots()',
    'public.check_signup_conflict(text,text,text)',
    'public.get_ranking_counts()',
    'public.bump_session_counter()',
    'public.bump_user_counter()',
    'public.emit_appointment_event()',
    'public.handle_new_user()',
    'public.sync_profile_to_ranking_snapshot()'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f);
  END LOOP;
END $$;

-- Calendar blocks: hide private event titles from clients
REVOKE SELECT ON public.google_calendar_blocks FROM anon, authenticated;
GRANT SELECT (id, professional_id, start_time, end_time, is_all_day, created_at, updated_at)
  ON public.google_calendar_blocks TO anon, authenticated;
GRANT ALL ON public.google_calendar_blocks TO service_role;

-- OSMF reports are inserted only by the server function (rate limited)
DROP POLICY IF EXISTS "OSMF reports: anyone can insert" ON public.osmf_reports;

-- OSMF attachments: only flat, randomly named files with allowed extensions
DROP POLICY IF EXISTS "OSMF uploads: anyone can insert" ON storage.objects;
CREATE POLICY "OSMF uploads: restricted insert" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'osmf-reports'
  AND name ~ '^[0-9]{10,16}-[a-z0-9]{1,12}\.(jpg|jpeg|png|webp|gif|pdf|mp4|mov|heic)$'
);