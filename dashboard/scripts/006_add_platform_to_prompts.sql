-- Add platform column to prompts table
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'discord';

-- Set existing prompts to 'discord' as the default for the backfill migration
UPDATE public.prompts SET platform = 'discord' WHERE platform IS NULL;

-- Enforce NOT NULL now that data is backfilled
ALTER TABLE public.prompts ALTER COLUMN platform SET NOT NULL;

-- Create an index to improve lookup speeds for the extension
CREATE INDEX IF NOT EXISTS idx_prompts_user_platform ON public.prompts(user_id, platform);
