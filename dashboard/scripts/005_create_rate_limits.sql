-- Rate limiting table backed by Supabase instead of in-memory Map.
-- Uses a sliding window counter approach: one row per key per window.
-- Old windows are cleaned up automatically via a scheduled delete or on read.

CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(key, window_start)
);

-- Fast lookups by key
CREATE INDEX IF NOT EXISTS idx_rate_limit_key ON public.rate_limit_entries(key);

-- Fast cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON public.rate_limit_entries(window_start);

-- No RLS needed - this table is only accessed via service role key
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- Cleanup function: remove entries older than 1 hour
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limit_entries
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
