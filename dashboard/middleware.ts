import { updateSession } from '@/lib/supabase/proxy'
import { logger } from '@/lib/logger'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (e) {
    logger.exception('middleware.error', e, { path: request.nextUrl.pathname })
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/protected/:path*',
    /*
     * Exclude /auth/callback from middleware to avoid interfering with the
     * OAuth code exchange.  The callback route needs to run without the
     * middleware trying to refresh a session that doesn't exist yet.
     */
    '/auth/login',
    '/auth/sign-up',
    '/auth/extension-connected',
    '/api/extension/:path*',
    '/api/lemonsqueezy/:path*',
    '/api/webhooks/lava/:path*',
  ],
}
