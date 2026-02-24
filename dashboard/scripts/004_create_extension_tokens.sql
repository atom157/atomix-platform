-- Extension tokens table for secure extension-to-API authentication.
-- Instead of using the raw Supabase userId, the extension stores a
-- server-generated opaque token that maps back to the user.

CREATE TABLE IF NOT EXISTS public.extension_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
  is_revoked BOOLEAN DEFAULT false
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_extension_tokens_hash ON public.extension_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_extension_tokens_user_id ON public.extension_tokens(user_id);

-- RLS: only the user can see their own tokens via dashboard
ALTER TABLE public.extension_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extension_tokens_select_own" ON public.extension_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "extension_tokens_delete_own" ON public.extension_tokens
  FOR DELETE USING (auth.uid() = user_id);
