/**
 * Structured logger for serverless environments.
 *
 * Outputs JSON to stdout/stderr so Vercel Log Drains, Axiom, Datadog,
 * or any log aggregator can parse, filter, and alert on events.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.error('webhook.signature_invalid', { ip, path })
 *   logger.warn('rate_limit.exceeded', { userId, endpoint })
 *   logger.info('generate.success', { userId, model, tokens })
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  event: string
  timestamp: string
  [key: string]: unknown
}

function emit(level: LogLevel, event: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  const line = JSON.stringify(entry)

  switch (level) {
    case 'error':
      console.error(line)
      break
    case 'warn':
      console.warn(line)
      break
    default:
      console.log(line)
  }
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => emit('info', event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => emit('warn', event, meta),
  error: (event: string, meta?: Record<string, unknown>) => emit('error', event, meta),

  /** Convenience: log an Error object with stack trace */
  exception: (event: string, err: unknown, meta?: Record<string, unknown>) => {
    const errorInfo =
      err instanceof Error
        ? { errorMessage: err.message, errorStack: err.stack }
        : { errorMessage: String(err) }
    emit('error', event, { ...errorInfo, ...meta })
  },

  /** Security-relevant event (auth failure, rate limit, suspicious input) */
  security: (event: string, meta?: Record<string, unknown>) =>
    emit('warn', event, { ...meta, security: true }),
}

/**
 * Extract client IP from request headers (Vercel sets x-forwarded-for).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
