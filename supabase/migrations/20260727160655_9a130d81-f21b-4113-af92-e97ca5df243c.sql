-- 1. Snapshot tables
CREATE TABLE IF NOT EXISTS public.ranking_snapshot (
  user_id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  favorite_club_id text,
  sessions_count integer NOT NULL DEFAULT 0,
  checkins_count integer NOT NULL DEFAULT 0,
  courses_count integer NOT NULL DEFAULT 0,
  activities_count integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ranking_snapshot TO authenticated;
GRANT ALL ON public.ranking_snapshot TO service_role;
ALTER TABLE public.ranking_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ranking snapshot is readable by authenticated"
  ON public.ranking_snapshot FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_ranking_snapshot_position ON public.ranking_snapshot (position);

CREATE TABLE IF NOT EXISTS public.club_ranking_snapshot (
  favorite_club_id text PRIMARY KEY,
  fans_count integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.club_ranking_snapshot TO authenticated;
GRANT ALL ON public.club_ranking_snapshot TO service_role;
ALTER TABLE public.club_ranking_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Club ranking snapshot is readable by authenticated"
  ON public.club_ranking_snapshot FOR SELECT TO authenticated USING (true);

-- 2. Refresh routine
CREATE OR REPLACE FUNCTION public.refresh_ranking_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ranking_snapshot;
  INSERT INTO public.ranking_snapshot (
    user_id, full_name, avatar_url, favorite_club_id,
    sessions_count, checkins_count, courses_count, activities_count, points, position
  )
  SELECT
    r.user_id, r.full_name, r.avatar_url, r.favorite_club_id,
    r.sessions_count, r.checkins_count, r.courses_count, r.activities_count, r.points,
    ROW_NUMBER() OVER (ORDER BY r.points DESC, r.full_name ASC)::int
  FROM public.get_fan_ranking() r;

  DELETE FROM public.club_ranking_snapshot;
  INSERT INTO public.club_ranking_snapshot (favorite_club_id, fans_count, points)
  SELECT favorite_club_id, fans_count, points
  FROM public.get_club_ranking()
  WHERE favorite_club_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_ranking_snapshots() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_ranking_snapshots() TO service_role;

SELECT public.refresh_ranking_snapshots();

-- 3. Indexes on hot tables
CREATE INDEX IF NOT EXISTS idx_football_news_published_at ON public.football_news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_football_news_club_published ON public.football_news (club_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_entries_user_date ON public.emotion_entries (user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_user_status ON public.appointments (user_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_prof_date ON public.appointments (professional_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_completion_user ON public.user_activity_completion (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_course_access_user ON public.user_course_access (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_lineups_user_date ON public.emotional_lineups (user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_match_expectations_user ON public.match_expectations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_user ON public.quiz_completions (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON public.user_notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_news_published ON public.health_news (is_published, published_at DESC);

-- 4. Maintenance: chunked cron log retention
CREATE OR REPLACE FUNCTION public.purge_cron_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted integer;
  loops integer := 0;
BEGIN
  LOOP
    DELETE FROM cron.job_run_details
    WHERE ctid IN (
      SELECT ctid FROM cron.job_run_details
      WHERE end_time < now() - interval '2 days'
      LIMIT 20000
    );
    GET DIAGNOSTICS deleted = ROW_COUNT;
    loops := loops + 1;
    EXIT WHEN deleted = 0 OR loops >= 40;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'purge_cron_history failed: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_cron_history() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_cron_history() TO service_role;

SELECT cron.schedule('refresh-ranking-snapshots', '*/10 * * * *', $cron$ SELECT public.refresh_ranking_snapshots(); $cron$);
SELECT cron.schedule('purge-cron-history', '7 * * * *', $cron$ SELECT public.purge_cron_history(); $cron$);