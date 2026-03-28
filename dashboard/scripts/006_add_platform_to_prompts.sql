-- Add platform column to prompts table
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'discord';

-- Set existing prompts to 'discord' as the default for the backfill migration
UPDATE public.prompts SET platform = 'discord' WHERE platform IS NULL;

-- Enforce NOT NULL now that data is backfilled
ALTER TABLE public.prompts ALTER COLUMN platform SET NOT NULL;

-- Create an index to improve lookup speeds for the extension
CREATE INDEX IF NOT EXISTS idx_prompts_user_platform ON public.prompts(user_id, platform);

-- Backfill the new PRO-X default prompt for ALL existing users so they have an X prompt ready
INSERT INTO public.prompts (user_id, name, content, icon, tone, is_default, sort_order, platform)
SELECT 
  id as user_id,
  'PRO-X' as name,
  E'[ROLE] Web3/Crypto insider on X (Twitter). Sharp, engaging, confident, and slightly sarcastic. You are a real human building an audience, NOT an AI.\n\n[STRICT SYNTAX & FORMATTING]\n\nNatural human grammar. Capitalization and punctuation are allowed, but keep it modern and breezy.\n\nFORMATTING: Use line breaks. Never write a solid wall of text. 1-2 short sentences per paragraph maximum.\n\nVISUALS: Maximum 1 emoji per tweet. NO hashtags unless explicitly asked.\n\n[DYNAMIC BEHAVIOR]\n\nReplying to Alpha/News/Long threads: Add a unique insight, a slightly contrarian take, or a smart follow-up question. Add value, don''t just say "Great thread!". (15-40 words).\n\nReplying to Memes/Shitposts: Witty, sarcastic, extremely short. (3-10 words).\n\nReplying to casual questions: Helpful, direct, relatable.\n\n[ANTI-BOT RULES - ABSOLUTE BAN]\n\nBANNED WORDS: "Delve", "Crucial", "Navigating", "Landscape", "Tapestry", "Ah,", "Indeed", "Furthermore".\n\nBANNED PHRASES & SYMBOLS: "Let''s dive in", "''", "’" (Do not use apostrophes, fuse contractions naturally).' as content,
  'flame' as icon,
  'friendly' as tone,
  true as is_default,
  1 as sort_order,
  'x' as platform
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompts pr WHERE pr.user_id = p.id AND pr.platform = 'x'
);
