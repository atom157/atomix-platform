'use client'

import { useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function DirectGoogleAuthLogic() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const hasTriggered = useRef(false)

  useEffect(() => {
    // StrictMode safeguard
    if (hasTriggered.current) return
    hasTriggered.current = true

    const signIn = async () => {
      const supabase = createClient()

      // Store redirect in cookie to bypass Supabase URI strict-matching dropping query params
      document.cookie = `auth_redirect=${encodeURIComponent(redirectTo)}; path=/; max-age=3600; SameSite=Lax`

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://atomix.guru/auth/callback`,
        },
      })
    }

    signIn()
  }, [redirectTo])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
      <p className="text-slate-600 font-medium">Connecting securely...</p>
    </div>
  )
}

export default function DirectGoogleAuth() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
        <p className="text-slate-600 font-medium">Loading auth...</p>
      </div>
    }>
      <DirectGoogleAuthLogic />
    </Suspense>
  )
}
