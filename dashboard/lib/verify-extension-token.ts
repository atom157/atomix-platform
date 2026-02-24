import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface VerifyResult {
  valid: boolean
  userId?: string
  error?: string
}

/**
 * Verifies an extension token sent via the Authorization header.
 * Tokens are hashed before lookup so the raw token is never stored.
 */
export async function verifyExtensionToken(
  request: Request
): Promise<VerifyResult> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or malformed Authorization header' }
  }

  const rawToken = authHeader.slice(7).trim()

  if (!rawToken || rawToken.length < 32) {
    return { valid: false, error: 'Invalid token format' }
  }

  // Hash the incoming token
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex')

  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from('extension_tokens')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired token' }
  }

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    // Clean up expired token
    await admin.from('extension_tokens').delete().eq('token_hash', tokenHash)
    return { valid: false, error: 'Token has expired. Please reconnect in the extension.' }
  }

  return { valid: true, userId: data.user_id }
}
