DROP FUNCTION IF EXISTS public.get_club_ranking();
DROP FUNCTION IF EXISTS public.get_fan_ranking();

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
    SELECT user_id, COUNT(*)::int AS c
    FROM public.user_activity_completion, cutoff
    WHERE completed_at >= cutoff.d
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

CREATE OR REPLACE FUNCTION public.get_club_ranking()
 RETURNS TABLE(favorite_club_id text, fans_count integer, points integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    favorite_club_id,
    COUNT(*)::int AS fans_count,
    SUM(points)::int AS points
  FROM public.get_fan_ranking()
  WHERE favorite_club_id IS NOT NULL
  GROUP BY favorite_club_id;
$function$;