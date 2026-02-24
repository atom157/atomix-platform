import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/extension/auth
 *
 * Redirects the user to the login page with the correct post-login redirect.
 *
 * Previously this route tried to call `signInWithOAuth` server-side from a
 * Route Handler.  That approach silently fails because the PKCE code_verifier
 * cookie can never be written back to the browser from a GET Route Handler
 * response that immediately 302-redirects.  The `setAll` callback inside the
 * server Supabase client swallows the error, so no cookie is set, and the
 * subsequent `exchangeCodeForSession` in /auth/callback fails with
 * "context canceled" / "unexpected-error".
 *
 * The fix: simply redirect to the login page which already handles OAuth
 * client-side (where cookies work correctly), passing the intended
 * post-auth destination via query params.
 */
export async function GET(request: Request) {
  try {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

    // Send the user to the login page; the login page's Google OAuth button
    // already calls signInWithOAuth on the client side (where PKCE cookies
    // are set correctly by the browser Supabase client).
    const loginUrl = new URL('/auth/login', appUrl)
    loginUrl.searchParams.set('redirectTo', '/auth/extension-connected')
    loginUrl.searchParams.set('source', 'extension')

    return NextResponse.redirect(loginUrl.toString())
  } catch (err) {
    logger.exception('extension_auth.redirect_error', err, {
      route: '/api/extension/auth',
    })
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    return NextResponse.redirect(
      `${appUrl}/auth/error?message=${encodeURIComponent('Failed to start authentication')}`
    )
  }
}
