
-- 1) Update handle_new_user to honor account_type=pro metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_pro boolean := COALESCE(NEW.raw_user_meta_data ->> 'account_type', '') = 'pro';
BEGIN
  -- Always create a profile row
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (user_id) DO NOTHING;

  IF is_pro THEN
    -- Assign professional role immediately so the app routes correctly
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Create minimal professional record so onboarding wizard has a row to update
    INSERT INTO public.professionals (user_id, is_active, is_verified, approval_status)
    VALUES (NEW.id, false, false, 'pending_approval')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users (re-bind defensively)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Wipe Lais's account so she can start over
DELETE FROM public.professionals    WHERE user_id = '903cec9e-3120-446b-9b18-965be252dfad';
DELETE FROM public.user_roles       WHERE user_id = '903cec9e-3120-446b-9b18-965be252dfad';
DELETE FROM public.profiles         WHERE user_id = '903cec9e-3120-446b-9b18-965be252dfad';
DELETE FROM auth.users              WHERE id      = '903cec9e-3120-446b-9b18-965be252dfad';
