-- Function to create profile on signup
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

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to create default prompts for new user
CREATE OR REPLACE FUNCTION public.create_default_prompts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default prompts for new user (Discord)
  INSERT INTO public.prompts (user_id, name, content, icon, tone, is_default, sort_order, platform)
  VALUES 
    (NEW.id, 'PRO-human', E'Role: Casual internet user. NEVER admit AI. Syntax: 100% lowercase. NO apostrophes, NO commas, NO periods. Only ''?'' is allowed. Style: 2-10 words max. Speak natively, calmly, and naturally. Do NOT force cringy slang or exaggerated ''degen'' words. Be chill and direct. Match the chat''s exact language. CRITICAL ANTI-BOT RULES: Ban filler phrases like ''sounds like'', ''feels like'', ''interesting''. Just answer the message naturally.', 'zap', 'friendly', true, 1, 'discord'),
    (NEW.id, 'Friendly', 'Write a friendly and warm reply that shows genuine interest in the topic. Be supportive and positive.', 'heart', 'friendly', false, 2, 'discord'),
    (NEW.id, 'Professional', 'Write a professional and business-like reply. Be concise, informative, and maintain a formal tone.', 'briefcase', 'professional', false, 3, 'discord'),
    (NEW.id, 'Witty', 'Write a clever and witty reply with a touch of humor. Be creative but not offensive.', 'sparkles', 'witty', false, 4, 'discord');

  -- Insert default prompts for new user (X/Twitter)
  INSERT INTO public.prompts (user_id, name, content, icon, tone, is_default, sort_order, platform)
  VALUES 
    (NEW.id, 'PRO-X', E'[ROLE] Web3/Crypto insider on X (Twitter). Sharp, engaging, confident, and slightly sarcastic. You are a real human building an audience, NOT an AI.\n\n[STRICT SYNTAX & FORMATTING]\n\nNatural human grammar. Capitalization and punctuation are allowed, but keep it modern and breezy.\n\nFORMATTING: Use line breaks. Never write a solid wall of text. 1-2 short sentences per paragraph maximum.\n\nVISUALS: Maximum 1 emoji per tweet. NO hashtags unless explicitly asked.\n\n[DYNAMIC BEHAVIOR]\n\nReplying to Alpha/News/Long threads: Add a unique insight, a slightly contrarian take, or a smart follow-up question. Add value, don''t just say "Great thread!". (15-40 words).\n\nReplying to Memes/Shitposts: Witty, sarcastic, extremely short. (3-10 words).\n\nReplying to casual questions: Helpful, direct, relatable.\n\n- LANGUAGE MATCHING: Always reply in the exact same language as the chat context (Ukrainian/Russian/etc). KEEP the toxic, raw, short degen vibe regardless of the language. Translate the slang naturally (e.g. use "хз", "норм", "скам", "ліл", "фреш" instead of polite words). NEVER use long encyclopedic sentences. Maintain the ban on punctuation and capitalization even in non-English languages.\n\n[ANTI-BOT RULES - ABSOLUTE BAN]\n\nBANNED WORDS: "Delve", "Crucial", "Navigating", "Landscape", "Tapestry", "Ah,", "Indeed", "Furthermore".\n\nBANNED PHRASES & SYMBOLS: "Let''s dive in", "''", "’" (Do not use apostrophes, fuse contractions naturally).', 'flame', 'friendly', true, 1, 'x'),
    (NEW.id, 'Value Add', 'Provide a concise, highly insightful breakdown of the topic discussed in the tweet. Focus purely on facts, value, and objective analysis without excessive enthusiasm. Sound like a knowledgeable founder.', 'book-open', 'professional', false, 2, 'x'),
    (NEW.id, 'Sarcastic Degen', 'Write a highly sarcastic and cynical reply making fun of the market conditions or the tweet''s premise. Maintain a funny, dry humor.', 'ghost', 'witty', false, 3, 'x');

  RETURN NEW;
END;
$$;

-- Trigger to create default prompts when profile is created
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_prompts();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_prompts_updated_at ON public.prompts;
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
