-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS openai_api_key TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Update the plan CHECK constraint to support billing tiers
-- First drop the old constraint, then add the new one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check 
  CHECK (plan IN ('trial', 'free', 'pro', 'unlimited', 'active', 'expired', 'cancelled'));

-- Set default plan to 'free' for new users (instead of 'trial' if you prefer)
-- ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free';
