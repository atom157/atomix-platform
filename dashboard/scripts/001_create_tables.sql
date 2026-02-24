-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'free', 'pro', 'unlimited', 'active', 'expired', 'cancelled')),
  subscription_status TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days'),
  openai_api_key TEXT,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_subscription_id TEXT,
  generations_count INTEGER DEFAULT 0,
  generations_limit INTEGER DEFAULT 20, -- trial limit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompts table (user's custom prompts)
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT DEFAULT 'sparkles',
  tone TEXT DEFAULT 'friendly',
  language TEXT DEFAULT 'same',
  length TEXT DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_logs table (for tracking generations)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL,
  tweet_text TEXT,
  generated_reply TEXT,
  model TEXT DEFAULT 'gpt-4o-mini',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Prompts policies (user can only see/edit their own prompts)
CREATE POLICY "prompts_select_own" ON public.prompts 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prompts_insert_own" ON public.prompts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prompts_update_own" ON public.prompts 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prompts_delete_own" ON public.prompts 
  FOR DELETE USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "usage_logs_select_own" ON public.usage_logs 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "usage_logs_insert_own" ON public.usage_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_active ON public.prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);
