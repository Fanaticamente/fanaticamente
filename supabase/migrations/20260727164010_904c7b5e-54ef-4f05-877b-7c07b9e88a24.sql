
CREATE TABLE IF NOT EXISTS public.user_points_counters (
  user_id uuid PRIMARY KEY,
  sessions_count integer NOT NULL DEFAULT 0,
  checkins_count integer NOT NULL DEFAULT 0,
  courses_count integer NOT NULL DEFAULT 0,
  activities_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_points_counters TO authenticated;
GRANT ALL ON public.user_points_counters TO service_role;

ALTER TABLE public.user_points_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own counters"
ON public.user_points_counters FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_points_counters_updated_at
ON public.user_points_counters (updated_at DESC);

-- Generic bump function: TG_ARGV[0] = counter column, TG_ARGV[1] = weight
CREATE OR REPLACE FUNCTION public.bump_user_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  col text := TG_ARGV[0];
  uid uuid;
BEGIN
  uid := NEW.user_id;
  IF uid IS NULL THEN RETURN NEW; END IF;

  EXECUTE format(
    'INSERT INTO public.user_points_counters (user_id, %I, updated_at)
     VALUES ($1, 1, now())
     ON CONFLICT (user_id) DO UPDATE SET %I = public.user_points_counters.%I + 1, updated_at = now()',
    col, col, col
  ) USING uid;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'bump_user_counter failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bump_session_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO public.user_points_counters (user_id, sessions_count, updated_at)
    VALUES (NEW.user_id, 1, now())
    ON CONFLICT (user_id) DO UPDATE
      SET sessions_count = public.user_points_counters.sessions_count + 1, updated_at = now();
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'bump_session_counter failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_counter_appointments ON public.appointments;
CREATE TRIGGER trg_counter_appointments
AFTER INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.bump_session_counter();

DROP TRIGGER IF EXISTS trg_counter_emotions ON public.emotion_entries;
CREATE TRIGGER trg_counter_emotions
AFTER INSERT ON public.emotion_entries
FOR EACH ROW EXECUTE FUNCTION public.bump_user_counter('checkins_count');

DROP TRIGGER IF EXISTS trg_counter_courses ON public.user_course_access;
CREATE TRIGGER trg_counter_courses
AFTER INSERT ON public.user_course_access
FOR EACH ROW EXECUTE FUNCTION public.bump_user_counter('courses_count');

DROP TRIGGER IF EXISTS trg_counter_activity ON public.user_activity_completion;
CREATE TRIGGER trg_counter_activity
AFTER INSERT ON public.user_activity_completion
FOR EACH ROW EXECUTE FUNCTION public.bump_user_counter('activities_count');

DROP TRIGGER IF EXISTS trg_counter_lineups ON public.emotional_lineups;
CREATE TRIGGER trg_counter_lineups
AFTER INSERT ON public.emotional_lineups
FOR EACH ROW EXECUTE FUNCTION public.bump_user_counter('activities_count');

DROP TRIGGER IF EXISTS trg_counter_expectations ON public.match_expectations;
CREATE TRIGGER trg_counter_expectations
AFTER INSERT ON public.match_expectations
FOR EACH ROW EXECUTE FUNCTION public.bump_user_counter('activities_count');

DROP TRIGGER IF EXISTS trg_counter_quiz ON public.quiz_completions;
CREATE TRIGGER trg_counter_quiz
AFTER INSERT ON public.quiz_completions
FOR EACH ROW EXECUTE FUNCTION public.bump_user_counter('activities_count');

-- Backfill from current live ranking (one-off, cheap at current volume)
INSERT INTO public.user_points_counters (user_id, sessions_count, checkins_count, courses_count, activities_count, updated_at)
SELECT r.user_id, r.sessions_count, r.checkins_count, r.courses_count, r.activities_count, now()
FROM public.get_fan_ranking() r
ON CONFLICT (user_id) DO UPDATE SET
  sessions_count = EXCLUDED.sessions_count,
  checkins_count = EXCLUDED.checkins_count,
  courses_count = EXCLUDED.courses_count,
  activities_count = EXCLUDED.activities_count,
  updated_at = now();

-- Ranking now reads counters instead of scanning 7 tables
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
    x.user_id, x.full_name, x.avatar_url, x.favorite_club_id,
    x.sessions_count, x.checkins_count, x.courses_count, x.activities_count, x.points,
    ROW_NUMBER() OVER (ORDER BY x.points DESC, x.full_name ASC)::int
  FROM (
    SELECT
      p.user_id,
      COALESCE(p.full_name, 'Torcedor') AS full_name,
      p.avatar_url,
      p.favorite_club_id,
      c.sessions_count, c.checkins_count, c.courses_count, c.activities_count,
      (c.sessions_count * 3 + c.checkins_count + c.courses_count + c.activities_count)::int AS points
    FROM public.user_points_counters c
    JOIN public.profiles p ON p.user_id = c.user_id
    WHERE (c.sessions_count + c.checkins_count + c.courses_count + c.activities_count) > 0
      AND COALESCE(p.full_name, '') !~* '(teste|universal)'
  ) x;

  DELETE FROM public.club_ranking_snapshot;
  INSERT INTO public.club_ranking_snapshot (favorite_club_id, fans_count, points)
  SELECT favorite_club_id, COUNT(*)::int, SUM(points)::int
  FROM public.ranking_snapshot
  WHERE favorite_club_id IS NOT NULL
  GROUP BY favorite_club_id;
END;
$$;

SELECT public.refresh_ranking_snapshots();

-- Daily retention of technical logs
CREATE OR REPLACE FUNCTION public.purge_operational_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notification_logs WHERE sent_at < now() - interval '90 days';
  DELETE FROM public.notification_events WHERE processed_at IS NOT NULL AND processed_at < now() - interval '30 days';
  DELETE FROM public.notification_rule_runs WHERE fired_at < now() - interval '90 days';
  DELETE FROM public.email_send_log WHERE created_at < now() - interval '60 days';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'purge_operational_logs failed: %', SQLERRM;
END;
$$;

SELECT cron.unschedule('purge-operational-logs')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-operational-logs');

SELECT cron.schedule('purge-operational-logs', '20 4 * * *', $cron$ SELECT public.purge_operational_logs(); $cron$);
