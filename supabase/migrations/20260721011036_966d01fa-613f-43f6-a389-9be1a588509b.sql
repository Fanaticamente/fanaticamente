
CREATE TABLE public.quiz_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_key text NOT NULL,
  score integer,
  total integer,
  completed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.quiz_completions TO authenticated;
GRANT ALL ON public.quiz_completions TO service_role;

ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz completions"
  ON public.quiz_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz completions"
  ON public.quiz_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update fan ranking to include quiz completions as activities (1 point each)
CREATE OR REPLACE FUNCTION public.get_fan_ranking()
 RETURNS TABLE(user_id uuid, full_name text, avatar_url text, favorite_club_id text, sessions_count integer, checkins_count integer, courses_count integer, activities_count integer, points integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH cutoff AS (SELECT '2026-07-20'::date AS d),
  s AS (
    SELECT user_id, COUNT(*)::int AS c
    FROM public.appointments, cutoff
    WHERE status = 'completed' AND scheduled_date >= cutoff.d
    GROUP BY user_id
  ),
  e AS (
    SELECT user_id, COUNT(*)::int AS c
    FROM public.emotion_entries, cutoff
    WHERE entry_date >= cutoff.d
    GROUP BY user_id
  ),
  c AS (
    SELECT user_id, COUNT(*)::int AS c
    FROM public.user_course_access, cutoff
    WHERE created_at >= cutoff.d
    GROUP BY user_id
  ),
  a AS (
    SELECT user_id, SUM(c)::int AS c FROM (
      SELECT user_id, COUNT(*)::int AS c
      FROM public.user_activity_completion, cutoff
      WHERE completed_at >= cutoff.d
      GROUP BY user_id
      UNION ALL
      SELECT user_id, COUNT(*)::int AS c
      FROM public.emotional_lineups, cutoff
      WHERE entry_date >= cutoff.d
      GROUP BY user_id
      UNION ALL
      SELECT user_id, COUNT(*)::int AS c
      FROM public.match_expectations, cutoff
      WHERE created_at >= cutoff.d
      GROUP BY user_id
      UNION ALL
      SELECT user_id, COUNT(*)::int AS c
      FROM public.quiz_completions, cutoff
      WHERE completed_at >= cutoff.d
      GROUP BY user_id
    ) x
    GROUP BY user_id
  )
  SELECT
    p.user_id,
    COALESCE(p.full_name, 'Torcedor') AS full_name,
    p.avatar_url,
    p.favorite_club_id,
    COALESCE(s.c, 0) AS sessions_count,
    COALESCE(e.c, 0) AS checkins_count,
    COALESCE(c.c, 0) AS courses_count,
    COALESCE(a.c, 0) AS activities_count,
    (COALESCE(s.c, 0) * 3 + COALESCE(e.c, 0) + COALESCE(c.c, 0) + COALESCE(a.c, 0))::int AS points
  FROM public.profiles p
  LEFT JOIN s ON s.user_id = p.user_id
  LEFT JOIN e ON e.user_id = p.user_id
  LEFT JOIN c ON c.user_id = p.user_id
  LEFT JOIN a ON a.user_id = p.user_id
  WHERE (COALESCE(s.c, 0) + COALESCE(e.c, 0) + COALESCE(c.c, 0) + COALESCE(a.c, 0)) > 0
    AND COALESCE(p.full_name, '') !~* '(teste|universal)'
  ORDER BY points DESC, full_name ASC;
$function$;
