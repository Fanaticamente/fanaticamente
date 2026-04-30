UPDATE public.app_modules
SET config = jsonb_set(config, '{show_badges}', 'true'::jsonb, true),
    updated_at = now()
WHERE module_id IN ('ranking_page', 'therapists_page');