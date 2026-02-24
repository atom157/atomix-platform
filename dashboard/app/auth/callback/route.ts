import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // Use NEXT_PUBLIC_APP_URL to avoid proxy/origin mismatches on Vercel
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      logger.error('auth.callback_exchange_failed', {
        errorMessage: error.message,
        errorStatus: error.status,
        redirectTo,
      })
      return NextResponse.redirect(
        `${appUrl}/auth/error?message=${encodeURIComponent(error.message)}`
      )
    }

    // Success - redirect to the intended destination
    const forwardUrl = redirectTo.startsWith('/') ? `${appUrl}${redirectTo}` : `${appUrl}/dashboard`
    return NextResponse.redirect(forwardUrl)
  }

  // No code parameter present
  logger.warn('auth.callback_no_code', { searchParams: Object.fromEntries(searchParams) })

  // Check if Supabase returned an error in the hash (e.g. access_denied)
  const errorDescription = searchParams.get('error_description')
  const errorMessage = errorDescription || 'No authorization code received'

  return NextResponse.redirect(
    `${appUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`
  )
}
