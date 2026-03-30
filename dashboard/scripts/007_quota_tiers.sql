-- ============================================================
-- 007_quota_tiers.sql
-- Migrate AtomiX to 3-tier SaaS quota model (FREE / PRO / ULTRA)
-- ============================================================

-- ── Step 1: Add new quota columns ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS initial_quota INTEGER DEFAULT 20;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_free_quota INTEGER DEFAULT 5;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_quota INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_daily_reset TIMESTAMPTZ DEFAULT NOW();

-- ── Step 2: Migrate existing data BEFORE adding the new constraint ──

-- 2a: Map legacy plan values to new tier names
UPDATE public.profiles SET plan = 'free' WHERE plan IN ('trial', 'expired', 'cancelled');
UPDATE public.profiles SET plan = 'pro'  WHERE plan IN ('active', 'unlimited');
-- Note: 'free' stays 'free', 'pro' stays 'pro', 'ultra' stays 'ultra'

-- 2b: Catch-all — any remaining unexpected plan values get set to 'free'
UPDATE public.profiles SET plan = 'free' WHERE plan NOT IN ('free', 'pro', 'ultra');

-- 2c: Set initial_quota to whatever remains of the original 20 signup bonus
UPDATE public.profiles SET initial_quota = GREATEST(0, 20 - COALESCE(generations_count, 0));

-- 2d: Set monthly quotas based on new plan
UPDATE public.profiles SET monthly_quota = 0    WHERE plan = 'free';
UPDATE public.profiles SET monthly_quota = 2000 WHERE plan = 'pro';
UPDATE public.profiles SET monthly_quota = 7000 WHERE plan = 'ultra';

-- 2e: Reset daily quota for all users
UPDATE public.profiles SET daily_free_quota = 5, last_daily_reset = NOW();

-- ── Step 3: NOW safe to add the new CHECK constraint ──
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check 
  CHECK (plan IN ('free', 'pro', 'ultra'));

-- ── Step 4: Create index on last_daily_reset for efficient daily reset queries ──
CREATE INDEX IF NOT EXISTS idx_profiles_last_daily_reset ON public.profiles(last_daily_reset);
