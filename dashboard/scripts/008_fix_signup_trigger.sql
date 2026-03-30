-- ============================================================
-- 008_fix_signup_trigger.sql
-- Fix: new user signup fails because column DEFAULT is 'trial'
-- which violates the CHECK constraint from migration 007.
-- ============================================================

-- ── Step 1: Change the column DEFAULT from 'trial' to 'free' ──
ALTER TABLE public.profiles ALTER COLUMN plan SET DEFAULT 'free';

-- ── Step 2: Recreate the signup trigger with explicit plan + quota values ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, plan, initial_quota, daily_free_quota, monthly_quota, last_daily_reset)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL),
    'free',
    20,
    5,
    0,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$;
