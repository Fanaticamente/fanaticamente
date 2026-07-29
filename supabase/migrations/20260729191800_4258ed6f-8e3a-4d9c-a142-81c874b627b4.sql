CREATE OR REPLACE FUNCTION public.sync_profile_to_ranking_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.ranking_snapshot
  SET avatar_url = NEW.avatar_url,
      full_name = COALESCE(NEW.full_name, 'Torcedor'),
      favorite_club_id = NEW.favorite_club_id,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'sync_profile_to_ranking_snapshot failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_to_ranking ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_ranking
AFTER UPDATE OF avatar_url, full_name, favorite_club_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_ranking_snapshot();