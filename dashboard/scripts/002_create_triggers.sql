-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL)
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
  -- Insert default prompts for new user
  INSERT INTO public.prompts (user_id, name, content, icon, tone, is_default, sort_order)
  VALUES 
    (NEW.id, 'PRO-human', E'Style:\n\u2022 start with lowercase\n\u2022 no period at the end\n\u2022 4\u201316 words (max 20)\n\u2022 human, casual tone\n\u2022 witty or slightly humorous\n\nGoal:\nmake the reply clever or relatable so it attracts likes.\n\nRules:\n\u2022 no hashtags\n\u2022 no emojis\n\u2022 no long explanations\n\u2022 avoid promotional tone\n\u2022 avoid any words with apostrophes (like whats, its, thats)\n\u2022 do not use '' or ?', 'zap', 'friendly', true, 1),
    (NEW.id, 'Friendly', 'Write a friendly and warm reply that shows genuine interest in the topic. Be supportive and positive.', 'heart', 'friendly', false, 2),
    (NEW.id, 'Professional', 'Write a professional and business-like reply. Be concise, informative, and maintain a formal tone.', 'briefcase', 'professional', false, 3),
    (NEW.id, 'Witty', 'Write a clever and witty reply with a touch of humor. Be creative but not offensive.', 'sparkles', 'witty', false, 4),
    (NEW.id, 'Curious', 'Ask a thoughtful follow-up question that shows genuine curiosity about the topic.', 'help-circle', 'curious', false, 5),
    (NEW.id, 'Supportive', 'Write an empathetic and supportive reply. Show understanding and offer encouragement.', 'thumbs-up', 'supportive', false, 6);

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
