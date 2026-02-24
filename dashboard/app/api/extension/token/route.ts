import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/extension/token
 * Called from the extension-connected page to generate a secure, opaque
 * extension token. Requires the user to be logged in via Supabase session.
 * Returns { token, userId } on success.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const admin = getSupabaseAdmin()

    // Generate a cryptographically random token
    const rawToken = crypto.randomBytes(48).toString('base64url')

    // Hash the token before storing (only store the hash, never the raw token)
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

    // Revoke any existing tokens for this user (single active token per user)
    await admin
      .from('extension_tokens')
      .delete()
      .eq('user_id', user.id)

    // Store the hashed token
    const { error } = await admin.from('extension_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
    })

    if (error) {
      logger.error('token.insert_failed', { userId: user.id, dbError: error.message })
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: 500 }
      )
    }

    logger.info('token.created', { userId: user.id })

    return NextResponse.json({
      token: rawToken,
      userId: user.id,
    })
  } catch (err) {
    logger.exception('token.error', err, { route: '/api/extension/token' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
