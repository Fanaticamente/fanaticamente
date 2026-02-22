
-- Add onesignal_player_id column to push_subscriptions
ALTER TABLE public.push_subscriptions 
ADD COLUMN IF NOT EXISTS onesignal_player_id TEXT;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_onesignal_player_id 
ON public.push_subscriptions (onesignal_player_id) 
WHERE onesignal_player_id IS NOT NULL;
