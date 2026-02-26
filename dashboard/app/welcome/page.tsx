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
    // Check auth status globally for Step 2 CTA conditions
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="relative min-h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden flex flex-col items-center">

            {/* Deep Violet/Blue Gradient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(76,29,149,0.3)_0%,_transparent_40%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,_rgba(30,58,138,0.4)_0%,_transparent_50%)]" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#120a2e] via-[#0f172a] to-[#0f172a] opacity-90" />
            </div>

            {/* Header */}
            <header className="w-full relative z-50 px-6 py-12 flex justify-center">
                <Link href="/" className="hover:opacity-90 transition-opacity">
                    <Logo className="scale-125 brightness-0 invert" />
                </Link>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative z-10 flex flex-col items-center justify-center">

                {/* 3-Card Horizontal Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8 items-stretch justify-center">

                    {/* Step 1: Pin It (Side-by-side Layout) */}
                    <div className="bg-white/[0.03] backdrop-blur-[20px] border-[0.5px] border-white/20 rounded-[2rem] p-8 md:p-10 flex shadow-2xl shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:border-white/30 transition-all duration-300 relative group overflow-hidden h-full min-h-[400px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-400/30 transition-colors" />
                        <div className="relative z-10 flex flex-col justify-between h-full w-full">
                            <div>
                                <div className="inline-flex items-center justify-center h-8 px-4 rounded-full bg-white/10 text-white font-semibold text-sm mb-6 border border-white/10">
                                    Step 1
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Pin It</h3>
                                <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-[200px]">
                                    Click the <strong className="text-white font-semibold">puzzle icon</strong> 🧩 in your Chrome toolbar and pin AtomiX for instant access.
                                </p>
                            </div>

                            {/* Faux Chrome Extensions UI */}
                            <div className="relative w-[280px] h-[160px] self-end mt-auto translate-x-4">
                                <div className="absolute inset-0 bg-white shadow-2xl rounded-2xl border border-slate-200 p-4 flex flex-col z-10 origin-bottom-right rotate-[-2deg] group-hover:rotate-0 transition-transform">
                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
                                        <svg className="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 11h-3.26c-.45-1.92-2-3.46-3.92-3.91V3.83c0-1.02-.83-1.84-1.84-1.84h-3.03c-1.02 0-1.84.83-1.84 1.84v3.26C4.69 7.54 3.15 9.08 2.7 11H1v3.03c0 1.02.83 1.84 1.84 1.84h3.03c1.02-8.35 1.84-8.35v-1.63z" opacity=".2" /><path d="M20.5 11h-3.26c-.45-1.92-2-3.46-3.92-3.91V3.83c0-1.02-.83-1.84-1.84-1.84h-3.03c-1.02 0-1.84.83-1.84 1.84v3.26C4.69 7.54 3.15 9.08 2.7 11H1v3.03c0 1.02.83 1.84 1.84 1.84h3.03c1.02 0 1.84-.83 1.84-1.84v-3.26c1.92-.45 3.46-2 3.91-3.92h3.26V11zm-5.76 1.5H19v-1.03h-4.26c-.34 1.5-1.5 2.66-3 3v4.26h-1.03v-4.26c-1.5-.34-2.66-1.5-3-3H3.5V11h4.26c.34-1.5 1.5-2.66 3-3V3.74h1.03V8c1.5.34 2.66 1.5 3 3h4.26v1.5z" /></svg>
                                        <span className="text-slate-700 font-semibold text-[15px]">Extensions</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                                <img src="/logo-512.png" alt="AtomiX icon" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="text-slate-800 font-medium text-[15px]">AtomiX</span>
                                        </div>
                                        {/* Pushed Pin State */}
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 shadow-sm relative mr-1">
                                            <svg className="w-5 h-5 text-blue-600 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h4v6h2v-6h4v-2l-2-2z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                {/* Cursor visual */}
                                <img src="/cursor.svg" alt="cursor pointer" className="absolute bottom-6 right-2 w-7 z-20 drop-shadow-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Connect Google (Centered Layout) */}
                    <div className="bg-white/[0.03] backdrop-blur-[20px] border-[0.5px] border-white/20 rounded-[2rem] p-8 md:p-10 flex flex-col shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 hover:border-white/30 transition-all duration-300 relative group overflow-hidden h-full min-h-[400px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-purple-400/30 transition-colors" />
                        <div className="relative z-10 flex flex-col items-center justify-center text-center h-full w-full">
                            <div className="inline-flex items-center justify-center h-8 px-4 rounded-full bg-white/10 text-white font-semibold text-sm mb-6 border border-white/10 mt-2">
                                Step 2
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Connect Google</h3>
                            <p className="text-slate-300 text-lg leading-relaxed mb-auto max-w-[280px]">
                                Sign in with Google below to activate your AI engine and sync your custom prompts.
                            </p>

                            <div className="w-full max-w-[280px] mt-8 mb-4">
                                <WelcomeActions user={user} />
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Generate on X (Centered / Animated) */}
                    <div className="bg-white/[0.03] backdrop-blur-[20px] border-[0.5px] border-white/20 rounded-[2rem] p-8 md:p-10 flex flex-col shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 hover:border-white/30 transition-all duration-300 relative group overflow-hidden h-full min-h-[400px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-blue-400/30 transition-colors" />
                        <div className="relative z-10 flex flex-col items-center justify-center text-center h-full w-full">
                            <div className="inline-flex items-center justify-center h-8 px-4 rounded-full bg-white/10 text-white font-semibold text-sm mb-6 border border-white/10 mt-2">
                                Step 3
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Generate on X</h3>
                            <p className="text-slate-300 text-lg leading-relaxed mb-auto max-w-[280px]">
                                Head to <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors underline decoration-blue-400/50 underline-offset-4">x.com</a> and look for the sparkling AtomiX button inside any reply box.
                            </p>

                            {/* Simulated Visual: Twitter Reply Box with Loop Animation */}
                            <div className="w-full mt-8 relative">
                                <div className="bg-white rounded-[1rem] p-4 text-left shadow-2xl border border-slate-200">
                                    <div className="flex gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                                        <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-lg p-3 relative h-20 overflow-hidden">
                                            {/* The Typing Text Layer */}
                                            <div className="absolute inset-x-3 inset-y-3 pointer-events-none">
                                                <style>{`
                                                    @keyframes typing {
                                                        0% { width: 0; opacity: 1; }
                                                        40% { width: 0; opacity: 1; }
                                                        80% { width: 100%; opacity: 1; }
                                                        100% { width: 100%; opacity: 1; }
                                                    }
                                                    .typewriter-text {
                                                        display: inline-block;
                                                        overflow: hidden;
                                                        white-space: normal;
                                                        color: #334155;
                                                        font-size: 11px;
                                                        line-height: 1.4;
                                                        font-weight: 500;
                                                        animation: typing 8s steps(60, end) infinite;
                                                    }
                                                `}</style>
                                                <span className="typewriter-text">
                                                    A thought-provoking point. The bureaucratic ceiling of historical communism often masked the original communal intent behind the nomenclature...
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pl-1">
                                        <div className="flex gap-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center shrink-0">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.75 2H4.25C3.01 2 2 3.01 2 4.25v15.5C2 20.99 3.01 22 4.25 22h15.5c1.24 0 2.25-1.01 2.25-2.25V4.25C22 3.01 20.99 2 19.75 2zM4.25 3.5h15.5c.41 0 .75.34.75.75v8.46l-2.2-2.2c-.39-.39-1.02-.39-1.41 0l-4.43 4.43-2.4-2.4c-.39-.39-1.02-.39-1.41 0l-5.15 5.15V4.25c0-.41.34-.75.75-.75zm15.5 17h-15.5c-.41 0-.75-.34-.75-.75v-1l6.09-6.09 2.45 2.44c.39.39 1.02.39 1.41 0l4.38-4.38 2.67 2.67v6.36c0 .41-.34.75-.75.75z" /><path d="M7 10.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" /></svg>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center shrink-0">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm1 13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10ZM9 15.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" /></svg>
                                            </div>
                                        </div>
                                        <div className="relative isolate">
                                            {/* Dynamic Generator Button */}
                                            <div className="relative inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-purple-500/20 z-10 overflow-hidden">
                                                <style>{`
                                                    @keyframes pulse-click {
                                                        0%, 25% { transform: scale(1); box-shadow: 0 4px 14px 0 rgba(168, 85, 247, 0.2); }
                                                        30% { transform: scale(0.95); box-shadow: 0 2px 8px 0 rgba(168, 85, 247, 0.4); }
                                                        35%, 100% { transform: scale(1); box-shadow: 0 4px 14px 0 rgba(168, 85, 247, 0.2); }
                                                    }
                                                    .animate-pulse-btn {
                                                       animation: pulse-click 8s ease-in-out infinite;
                                                    }
                                                `}</style>
                                                <div className="absolute inset-0 bg-white/20 animate-pulse-btn opacity-0" />
                                                <svg className="w-3.5 h-3.5 text-white/90 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span className="text-[13px] font-bold">Generate</span>
                                            </div>

                                            {/* Cursor Animation pointing to the Generate button */}
                                            <style>{`
                                                @keyframes cursor-move {
                                                    0%, 10% { transform: translate(40px, 40px); opacity: 0; }
                                                    20% { transform: translate(40px, 40px); opacity: 1; }
                                                    28% { transform: translate(25px, 8px); opacity: 1; }
                                                    32% { transform: translate(25px, 8px) scale(0.9); opacity: 1; } /* Click */
                                                    38% { transform: translate(25px, 8px) scale(1); opacity: 1; }
                                                    50%, 100% { transform: translate(25px, 8px); opacity: 0; }
                                                }
                                                .cursor-anim {
                                                    animation: cursor-move 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                                                }
                                            `}</style>
                                            <img src="/cursor.svg" alt="cursor" className="absolute top-0 left-0 w-6 z-30 drop-shadow-md cursor-anim" />
                                        </div>
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

