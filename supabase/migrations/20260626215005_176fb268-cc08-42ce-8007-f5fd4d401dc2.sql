-- Newly signed-up professionals should NOT enter the admin "pending approval" queue
-- until they finish the onboarding wizard. Use 'incomplete' as the initial status.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_pro boolean := COALESCE(NEW.raw_user_meta_data ->> 'account_type', '') = 'pro';
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (user_id) DO NOTHING;

  IF is_pro THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'professional')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.professionals (user_id, is_active, is_verified, approval_status)
    VALUES (NEW.id, false, false, 'incomplete')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Move existing professionals that are stuck in pending_approval without having
-- completed the onboarding (no CRP, bio or specialties) back to 'incomplete'
-- so they stop polluting the admin queue.
UPDATE public.professionals
SET approval_status = 'incomplete'
WHERE approval_status = 'pending_approval'
  AND (
    crp IS NULL OR crp = ''
    OR bio IS NULL OR bio = ''
    OR specialties IS NULL OR array_length(specialties, 1) IS NULL
  );