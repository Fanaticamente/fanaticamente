-- Force reconnect for professionals whose Google Calendar connection
-- was authorized with insufficient scopes (calendar.events only).
-- Marking is_active = false will trigger the UI to show "Conectar" again.
UPDATE public.professional_google_calendar
SET is_active = false,
    access_token = '',
    token_expires_at = now() - interval '1 hour'
WHERE professional_id = '3632a749-f523-438d-8ff2-9cb64f39312a';
