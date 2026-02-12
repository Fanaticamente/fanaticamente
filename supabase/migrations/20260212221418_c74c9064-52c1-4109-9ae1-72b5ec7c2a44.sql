
CREATE OR REPLACE FUNCTION public.get_ranking_counts()
RETURNS TABLE(club_id text, session_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pr.favorite_club_id AS club_id,
    COUNT(a.id) AS session_count
  FROM appointments a
  INNER JOIN profiles pr ON pr.user_id = a.user_id
  WHERE a.status = 'concluido'
    AND pr.favorite_club_id IS NOT NULL
  GROUP BY pr.favorite_club_id;
$$;
