-- Add unique constraint on user_id + endpoint for upsert to work
ALTER TABLE public.push_subscriptions 
ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);