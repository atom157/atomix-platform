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
      const origin = window.location.origin

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
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
