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
        <div className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-200 font-sans overflow-hidden flex flex-col items-center">

            {/* Background */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(139,92,246,0.15)_0%,transparent_100%)] z-0" />

            <header className="w-full relative z-50 px-6 py-8 flex justify-center">
                <Link href="/">
                    <Logo className="scale-110" />
                </Link>
            </header>

            <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-8 pb-32 relative z-10 flex flex-col items-center">

                <div className="text-center mb-12 relative w-full">
                    <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-4 max-w-2xl mx-auto leading-tight">
                        You're All Set! 🚀
                    </h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
                        Complete these 3 quick steps to activate your AI engine.
                    </p>
                </div>

                <div className="flex flex-col gap-8 w-full">
                    {/* Card 1: Pin It */}
                    <div className="bg-white/60 backdrop-blur-2xl border-[0.5px] border-white/80 rounded-[2rem] p-1 shadow-2xl shadow-purple-500/5 hover:shadow-purple-500/10 transition-all duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="bg-white/40 rounded-[1.8rem] p-6 md:p-10 relative z-10 h-full flex flex-col md:flex-row gap-8 items-center border-[0.5px] border-white/40">
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-slate-100 text-slate-600 font-bold text-sm mb-4 border border-slate-200">
                                    Step 1
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Pin It</h3>
                                <p className="text-slate-500 text-lg font-medium leading-relaxed">
                                    Click the <strong className="text-slate-800">puzzle icon 🧩</strong> in your Chrome toolbar and pin AtomiX for instant access.
                                </p>
                            </div>

                            {/* Simulated Visual: Chrome Pin */}
                            <div className="w-full md:w-72 shrink-0 bg-slate-100/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-inner relative flex flex-col gap-3">
                                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                                    <div className="w-5 h-5 bg-slate-300 rounded-sm" />
                                    <div className="w-full h-5 bg-slate-200 rounded-sm flex items-center px-2"><span className="text-[10px] text-slate-400">Extensions</span></div>
                                </div>
                                <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-slate-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-[0.4rem] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-inner">
                                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700">AtomiX</span>
                                    </div>
                                    <svg className="w-5 h-5 text-blue-500 animate-pulse drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h4v6h2v-6h4v-2l-2-2z" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Connect Google */}
                    <div className="bg-white/60 backdrop-blur-2xl border-[0.5px] border-white/80 rounded-[2rem] p-1 shadow-2xl shadow-blue-500/5 hover:shadow-blue-500/10 transition-all duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/40 to-blue-200/40 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="bg-white/40 rounded-[1.8rem] p-6 md:p-10 relative z-10 h-full flex flex-col gap-8 items-center border-[0.5px] border-white/40">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-blue-50 text-blue-600 font-bold text-sm mb-4 border border-blue-100">
                                    Step 2
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Connect Google</h3>
                                <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-lg mx-auto">
                                    Sign in with Google below to activate your AI engine and sync your custom prompts.
                                </p>
                            </div>

                            {/* Inline Auth Component */}
                            <div className="w-full max-w-sm">
                                <WelcomeActions user={user} />
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Generate on X */}
                    <div className="bg-white/60 backdrop-blur-2xl border-[0.5px] border-white/80 rounded-[2rem] p-1 shadow-2xl shadow-indigo-500/5 hover:shadow-indigo-500/10 transition-all duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="bg-white/40 rounded-[1.8rem] p-6 md:p-10 relative z-10 h-full flex flex-col md:flex-row gap-8 items-center border-[0.5px] border-white/40">
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-slate-100 text-slate-600 font-bold text-sm mb-4 border border-slate-200">
                                    Step 3
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Generate on X</h3>
                                <p className="text-slate-500 text-lg font-medium leading-relaxed">
                                    Head to <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-purple-600 transition-colors underline font-bold">x.com</a> and look for the sparkling AtomiX button inside any reply box.
                                </p>
                            </div>

                            {/* Simulated Visual: Twitter Reply Box */}
                            <div className="w-full md:w-80 shrink-0 bg-white rounded-2xl p-4 border border-slate-200 shadow-md relative flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                                    <div className="flex-1 pt-1.5">
                                        <div className="text-slate-400 text-[15px] font-medium leading-tight">Post your reply</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                                    <div className="flex gap-4 pl-1">
                                        <div className="w-5 h-5 rounded-full bg-blue-100" />
                                        <div className="w-5 h-5 rounded-full bg-blue-100" />
                                        <div className="w-5 h-5 rounded-full bg-blue-100" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Faux AtomiX Button styled like the real injection */}
                                        <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-md shadow-purple-500/25">
                                            <svg className="w-3.5 h-3.5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span className="text-[13px] font-semibold text-white">Generate</span>
                                        </div>
                                        <div className="w-16 h-8 rounded-full bg-blue-400/50" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
