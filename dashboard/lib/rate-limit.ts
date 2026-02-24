import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

/**
 * Supabase-backed sliding window rate limiter.
 * Uses the rate_limit_entries table to persist counts across serverless invocations.
 * Run scripts/005_create_rate_limits.sql to create the table.
 */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetMs: number
}

/**
 * Check if a request is allowed under the rate limit.
 * Uses a fixed-window counter stored in Supabase.
 *
 * @param key - Unique identifier (e.g. userId or IP)
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin()
  const now = new Date()

  // Compute the start of the current window (truncate to window boundary)
  const windowStartMs =
    Math.floor(now.getTime() / config.windowMs) * config.windowMs
  const windowStart = new Date(windowStartMs).toISOString()

  // Try to increment an existing row for this key + window
  const { data: existing, error: selectError } = await supabase
    .from('rate_limit_entries')
    .select('id, request_count')
    .eq('key', key)
    .eq('window_start', windowStart)
    .maybeSingle()

  if (selectError) {
    // If DB is unavailable, fail open (allow the request) but log it
    logger.error('rate_limit.db_read_error', { key, dbError: selectError.message })
    return { allowed: true, remaining: config.maxRequests, resetMs: config.windowMs }
  }

  if (existing) {
    // Row exists for this window
    if (existing.request_count >= config.maxRequests) {
      const resetMs = windowStartMs + config.windowMs - now.getTime()
      return { allowed: false, remaining: 0, resetMs: Math.max(resetMs, 0) }
    }

    // Increment counter
    const { error: updateError } = await supabase
      .from('rate_limit_entries')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id)

    if (updateError) {
      logger.error('rate_limit.db_update_error', { key, dbError: updateError.message })
    }

    const remaining = config.maxRequests - (existing.request_count + 1)
    const resetMs = windowStartMs + config.windowMs - now.getTime()
    return { allowed: true, remaining: Math.max(remaining, 0), resetMs }
  }

  // No row yet - insert a new one
  const { error: insertError } = await supabase
    .from('rate_limit_entries')
    .insert({ key, window_start: windowStart, request_count: 1 })

  if (insertError) {
    // Could be a race condition (unique constraint). Try to read again.
    if (insertError.code === '23505') {
      // Duplicate - another request beat us. Re-read and increment.
      const { data: raceRow } = await supabase
        .from('rate_limit_entries')
        .select('id, request_count')
        .eq('key', key)
        .eq('window_start', windowStart)
        .maybeSingle()

      if (raceRow) {
        if (raceRow.request_count >= config.maxRequests) {
          const resetMs = windowStartMs + config.windowMs - now.getTime()
          return { allowed: false, remaining: 0, resetMs: Math.max(resetMs, 0) }
        }
        await supabase
          .from('rate_limit_entries')
          .update({ request_count: raceRow.request_count + 1 })
          .eq('id', raceRow.id)

        const remaining = config.maxRequests - (raceRow.request_count + 1)
        const resetMs = windowStartMs + config.windowMs - now.getTime()
        return { allowed: true, remaining: Math.max(remaining, 0), resetMs }
      }
    }

    logger.error('rate_limit.db_insert_error', { key, dbError: insertError.message })
    return { allowed: true, remaining: config.maxRequests, resetMs: config.windowMs }
  }

  const resetMs = windowStartMs + config.windowMs - now.getTime()
  return {
    allowed: true,
    remaining: config.maxRequests - 1,
    resetMs,
  }
}

// Default rate limit configs
export const RATE_LIMITS = {
  /** Generate endpoint: 20 requests per minute per user */
  generate: { maxRequests: 20, windowMs: 60 * 1000 },
  /** Prompts endpoint: 60 requests per minute per user */
  prompts: { maxRequests: 60, windowMs: 60 * 1000 },
  /** Auth endpoint: 10 requests per minute per IP */
  auth: { maxRequests: 10, windowMs: 60 * 1000 },
} as const
