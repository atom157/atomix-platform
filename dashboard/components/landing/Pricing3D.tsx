'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ChromeIcon = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 6.627 5.373 12 12 12 6.628 0 12-5.373 12-12C24 5.372 18.628 0 12 0zm0 2c4.856 0 8.895 3.456 9.8 8h-9.8c-1.123 0-2.126.476-2.834 1.233L4.981 3.987C6.883 2.721 9.324 2 12 2zm-8.85 5.5h5.176c-.21.776-.326 1.6-.326 2.5 0 2.228.91 4.244 2.373 5.702l-4.185 7.248C2.887 20.373 2 16.398 2 12c0-1.64.33-3.197.917-4.613L2.91 7.375zM12 15.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5zm7.382-6.5h3.69c.587 1.416.918 2.972.918 4.613 0 4.195-2.756 7.747-6.526 9.176L13.19 15.22c1.08-.888 1.83-2.193 1.99-3.663h4.202z" />
    </svg>
);

export function Pricing3D() {
    return (
        <section id="pricing" className="px-6 py-32 bg-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-100/40 blur-[100px] opacity-40 mix-blend-multiply pointer-events-none" />
            <div className="absolute bottom-[0%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-[100px] opacity-40 mix-blend-multiply pointer-events-none" />

            <div className="mx-auto max-w-6xl relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Pricing</span>
                    </h2>
                    <p className="mt-4 text-lg text-slate-600 font-medium max-w-2xl mx-auto">
                        Choose the plan that fits your workflow. No hidden fees.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto perspective-[1200px]">
                    {/* Free Plan */}
                    <div className="relative rounded-3xl p-8 flex flex-col h-full bg-white/50 border border-slate-200 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
                            <p className="text-slate-500 font-medium text-sm">Perfect for getting started</p>
                        </div>
                        <div className="mb-8">
                            <span className="text-4xl font-extrabold text-slate-900">$0</span>
                            <span className="text-slate-500 font-medium">/month</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center text-slate-600 font-medium">
                                <Check className="w-5 h-5 text-blue-500 mr-3" />
                                20 replies/month
                            </li>
                            <li className="flex items-center text-slate-600 font-medium">
                                <Check className="w-5 h-5 text-blue-500 mr-3" />
                                Standard generation
                            </li>
                            <li className="flex items-center text-slate-600 font-medium">
                                <Check className="w-5 h-5 text-blue-500 mr-3" />
                                Basic prompts
                            </li>
                        </ul>
                        <Button variant="outline" className="group w-full rounded-xl py-6 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-base transition-colors flex items-center justify-center gap-3">
                            <ChromeIcon className="w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-[1.15]" />
                            Add to Chrome — Free
                        </Button>
                    </div>

                    {/* PRO Plan */}
                    <div className="relative rounded-3xl p-[2px] flex flex-col h-full bg-gradient-to-b from-blue-500 to-purple-600 shadow-2xl shadow-purple-500/15 transform md:scale-105 z-10 transition-all duration-300 hover:shadow-purple-500/25 group">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-1 text-xs font-black tracking-wide text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] z-20">
                            MOST POPULAR
                        </div>

                        <div className="relative rounded-[22px] p-8 flex flex-col h-full bg-white/95 backdrop-blur-xl">
                            {/* Subtle internal glow matching HowItWorks */}
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-[22px] pointer-events-none" />

                            <div className="relative z-10 mb-6">
                                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">PRO Unlimited</h3>
                                <p className="text-slate-600 font-medium text-sm">For power users on X</p>
                            </div>
                            <div className="relative z-10 mb-8 flex items-baseline gap-2">
                                <span className="text-4xl font-extrabold text-slate-900">$9</span>
                                <span className="text-slate-500 font-medium">/month</span>
                            </div>
                            <ul className="relative z-10 space-y-4 mb-8 flex-1">
                                <li className="flex items-center text-slate-700 font-semibold">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                                        <Check className="w-4 h-4 text-purple-600" />
                                    </div>
                                    Unlimited AI Replies ✨
                                </li>
                                <li className="flex items-center text-slate-700 font-semibold">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                                        <Check className="w-4 h-4 text-purple-600" />
                                    </div>
                                    Unlimited Custom Prompts
                                </li>
                                <li className="flex items-center text-slate-700 font-semibold">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                                        <Check className="w-4 h-4 text-purple-600" />
                                    </div>
                                    Advanced Context Analysis
                                </li>
                                <li className="flex items-center text-slate-700 font-semibold">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                                        <Check className="w-4 h-4 text-purple-600" />
                                    </div>
                                    Priority Support
                                </li>
                            </ul>
                            <div className="relative z-10">
                                <Button className="w-full rounded-xl py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-base shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] border-0">
                                    Get Started with PRO
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
