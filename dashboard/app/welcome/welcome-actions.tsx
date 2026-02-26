'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'

function GoogleIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    )
}

interface WelcomeActionsProps {
    user: User | null;
}

export function WelcomeActions({ user }: WelcomeActionsProps) {
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGoogleLogin = async () => {
        const supabase = createClient()
        setIsGoogleLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // Redirect back to dashboard after successful OAuth
                    redirectTo: `https://atomix.guru/auth/callback?redirectTo=/dashboard`,
                },
            })
            if (error) throw error
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred during authentication')
            setIsGoogleLoading(false)
        }
    }

    // ── Logged In state ──
    if (user) {
        return (
            <div className="flex flex-col items-center gap-6 mt-4 relative z-20 w-full animate-in fade-in zoom-in duration-500">
                <Link href="/dashboard">
                    <Button className="h-16 px-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xl shadow-xl shadow-purple-500/25 transition-all hover:scale-105 border-0 flex items-center gap-3 group">
                        Go to Dashboard
                        <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Button>
                </Link>

                <p className="text-sm font-medium text-slate-500 flex items-center gap-2 bg-white/60 backdrop-blur-sm px-5 py-2.5 rounded-full border border-slate-100 shadow-sm">
                    Want infinite replies?
                    <Link href="/dashboard/billing" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold hover:opacity-80 transition-opacity">
                        Upgrade to PRO for $9/mo
                    </Link>
                </p>
            </div>
        )
    }

    // ── Not Logged In state ──
    return (
        <div className="flex flex-col items-center gap-6 mt-4 relative z-20 w-full">
            <Button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                variant="outline"
                className="h-16 px-12 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xl shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1 border border-slate-200 flex items-center gap-4 group"
            >
                {isGoogleLoading ? 'Connecting securely...' : (
                    <>
                        <GoogleIcon />
                        Sign in with Google
                    </>
                )}
            </Button>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <p className="text-sm font-medium text-slate-500 bg-white/60 backdrop-blur-sm px-5 py-2.5 rounded-full border border-slate-100 shadow-sm inline-flex items-center gap-2">
                <span className="text-green-500">🔒</span> Secure authentication required to sync your prompts.
            </p>
        </div>
    )
}
