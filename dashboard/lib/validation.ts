/**
 * Input validation and sanitization utilities for API routes.
 */

// UUID v4 format check (Supabase user IDs are UUIDs)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Maximum lengths for text fields
const MAX_TWEET_TEXT = 1000
const MAX_AUTHOR_NAME = 100
const MAX_HANDLE = 50
const MAX_PROMPT_CONTENT = 5000
const MAX_PROMPT_NAME = 100
const MAX_BANNED_WORDS = 500
const MAX_THREAD_ITEMS = 5

const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-3.5-turbo']
const ALLOWED_TONES = ['friendly', 'professional', 'casual', 'witty', 'supportive', 'curious']
const ALLOWED_LENGTHS = ['short', 'medium', 'long']
const ALLOWED_LANGUAGES = ['same', 'uk', 'en', 'ru']

/**
 * Validates that a string is a valid UUID v4.
 */
export function validateUserId(id: unknown): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id)
}

/**
 * Strips HTML tags and trims whitespace to prevent XSS in stored/returned text.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Strip control chars (preserve newlines \n, tabs \t, carriage returns \r)
    .trim()
}

/**
 * Validates tweet data shape and text content.
 */
export function validateTweetData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  // text is required and must be a non-empty string within limits
  if (typeof d.text !== 'string' || d.text.trim().length === 0) return false
  if (d.text.length > MAX_TWEET_TEXT) return false

  // author and handle are optional but validated if present
  if (d.author !== undefined && typeof d.author !== 'string') return false
  if (d.author && (d.author as string).length > MAX_AUTHOR_NAME) return false

  if (d.handle !== undefined && typeof d.handle !== 'string') return false
  if (d.handle && (d.handle as string).length > MAX_HANDLE) return false

  // threadContext must be an array of strings if present
  if (d.threadContext !== undefined) {
    if (!Array.isArray(d.threadContext)) return false
    if (d.threadContext.length > MAX_THREAD_ITEMS) return false
    for (const item of d.threadContext) {
      if (typeof item !== 'string') return false
      if (item.length > MAX_TWEET_TEXT) return false
    }
  }

  return true
}

/**
 * Validates and sanitizes generation settings, returning only known-safe values.
 */
export function validateSettings(settings: unknown): Record<string, unknown> {
  if (!settings || typeof settings !== 'object') return {}

  const s = settings as Record<string, unknown>
  const safe: Record<string, unknown> = {}

  // model - whitelist only
  if (typeof s.model === 'string' && ALLOWED_MODELS.includes(s.model)) {
    safe.model = s.model
  } else {
    safe.model = 'gpt-4o-mini'
  }

  // tone - whitelist only
  if (typeof s.tone === 'string' && ALLOWED_TONES.includes(s.tone)) {
    safe.tone = s.tone
  } else {
    safe.tone = 'friendly'
  }

  // length - whitelist only
  if (typeof s.length === 'string' && ALLOWED_LENGTHS.includes(s.length)) {
    safe.length = s.length
  } else {
    safe.length = 'medium'
  }

  // language - whitelist only
  if (typeof s.language === 'string' && ALLOWED_LANGUAGES.includes(s.language)) {
    safe.language = s.language
  } else {
    safe.language = 'same'
  }

  // Boolean flags
  safe.mentionAuthor = s.mentionAuthor !== false
  safe.addEmoji = s.addEmoji !== false
  safe.includeHashtags = s.includeHashtags === true

  // bannedWords - sanitize and limit length
  if (typeof s.bannedWords === 'string') {
    safe.bannedWords = sanitizeText(s.bannedWords).slice(0, MAX_BANNED_WORDS)
  } else {
    safe.bannedWords = ''
  }

  // customPrompt - pass through inline prompt from extension if present
  if (typeof s.customPrompt === 'string') {
    safe.customPrompt = sanitizeText(s.customPrompt).slice(0, MAX_PROMPT_CONTENT)
  }

  return safe
}

/**
 * Validates prompt content for creating/updating prompts.
 */
export function validatePromptInput(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid input' }
  }
  const d = data as Record<string, unknown>

  if (typeof d.name !== 'string' || d.name.trim().length === 0) {
    return { valid: false, error: 'Prompt name is required' }
  }
  if (d.name.length > MAX_PROMPT_NAME) {
    return { valid: false, error: `Prompt name must be under ${MAX_PROMPT_NAME} characters` }
  }

  if (typeof d.content !== 'string' || d.content.trim().length === 0) {
    return { valid: false, error: 'Prompt content is required' }
  }
  if (d.content.length > MAX_PROMPT_CONTENT) {
    return { valid: false, error: `Prompt content must be under ${MAX_PROMPT_CONTENT} characters` }
  }

  return { valid: true }
}
