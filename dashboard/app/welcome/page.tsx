import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { WelcomeActions } from './welcome-actions';

export const metadata: Metadata = {
    title: "Welcome to AtomiX | You're All Set!",
    description: 'Pin the extension and start generating AI replies on X instantly.',
};

export default async function WelcomePage() {
    // Check if the user is already authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="relative min-h-screen bg-white text-slate-900 selection:bg-purple-200 font-sans overflow-hidden flex flex-col items-center">

            {/* Soft Background Gradient matching Landing Page/Popup */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.1)_0%,transparent_100%)] z-0" />

            {/* Header/Logo */}
            <header className="w-full relative z-50 px-6 py-6 flex justify-center">
                <Link href="/">
                    <Logo className="scale-110" />
                </Link>
            </header>

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-12 pb-24 relative z-10 flex flex-col items-center">

                {/* Intro Section with Pulse Animation */}
                <div className="text-center mb-16 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-[80px] -z-10 rounded-full animate-pulse" />
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-2xl mx-auto leading-tight">
                        Welcome to the Future of X. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">You're All Set! 🚀</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto font-medium">
                        AtomiX is now installed and ready to use. Follow these 3 quick steps to generate your first viral reply.
                    </p>
                </div>

                {/* 3-Step Quick Start Glassmorphic Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 w-full">
                    {/* Step 1 */}
                    <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl shadow-slate-200/50 hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-2xl opacity-50 -mr-10 -mt-10 group-hover:opacity-80 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl mb-6 shadow-md shadow-purple-500/20">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Pin It</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                Click the <strong className="text-slate-800">puzzle icon 🧩</strong> in your Chrome toolbar and pin AtomiX for instant access to your settings.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 (Connect Google) */}
                    <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl shadow-slate-200/50 hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full blur-2xl opacity-50 -mr-10 -mt-10 group-hover:opacity-80 transition-opacity" />
                        <div className="relative z-10">
                            {user ? (
                                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white font-bold text-xl mb-6 shadow-md shadow-emerald-500/20">
                                    ✓
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white font-bold text-xl mb-6 shadow-md shadow-slate-900/20">
                                    🔒
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Connect Google</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                {user ? (
                                    <>Successfully connected as <strong className="text-slate-900">{user.email}</strong>. Your settings are synced.</>
                                ) : (
                                    <>Sign in with Google below to activate your AI engine and sync your custom prompts across devices.</>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Step 3 (Generate on X) */}
                    <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 shadow-xl shadow-slate-200/50 hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-2xl opacity-50 -mr-10 -mt-10 group-hover:opacity-80 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold text-xl mb-6 shadow-md shadow-indigo-500/20">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Generate on X</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                Head to <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-purple-600 transition-colors underline font-bold">x.com</a> and find the sparkling <strong className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AtomiX</strong> button in any reply box to start creating.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Authentication Conditional CTAs */}
                <WelcomeActions user={user} />

            </main>
        </div>
    );
}
