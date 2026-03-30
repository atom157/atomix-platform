'use client';

import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePostHog } from 'posthog-js/react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const ChromeIcon = ({ className = "" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="chrome-a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#d93025" />
                <stop offset="1" stopColor="#ea4335" />
            </linearGradient>
            <linearGradient id="chrome-b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#fcc934" />
                <stop offset="1" stopColor="#fbbc04" />
            </linearGradient>
            <linearGradient id="chrome-c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#1e8e3e" />
                <stop offset="1" stopColor="#34a853" />
            </linearGradient>
        </defs>
        <circle cx="24" cy="23.9947" r="12" fill="#fff" />
        <path d="M3.2154,36A24,24,0,1,0,12,3.2154,24,24,0,0,0,3.2154,36ZM34.3923,18A12,12,0,1,1,18,13.6077,12,12,0,0,1,34.3923,18Z" fill="none" />
        <path d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z" fill="url(#chrome-a)" />
        <circle cx="24" cy="24" r="9.5" fill="#1a73e8" />
        <path d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z" fill="url(#chrome-b)" />
        <path d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z" fill="url(#chrome-c)" />
    </svg>
);

export function Pricing3D() {
    const posthog = usePostHog();
    const router = useRouter();
    const supabase = createClient();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleCheckout = async (plan: 'pro' | 'ultra') => {
        setLoadingPlan(plan);
        posthog?.capture('pricing_clicked', { plan });

        if (plan === 'ultra') {
            // Direct Lava.top link for ULTRA
            window.open(
                'https://app.lava.top/products/7f0b7bdd-1d52-4d18-9c30-6c57c5978415/5844220a-5811-4a3b-a15d-f2f735570b4b',
                '_blank'
            );
            setLoadingPlan(null);
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                router.push('/dashboard?checkout=pro');
            } else {
                document.cookie = `auth_redirect=${encodeURIComponent('/dashboard?checkout=pro')}; path=/; max-age=3600; SameSite=Lax`
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: `https://atomix.guru/auth/callback`,
                    },
                });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            setLoadingPlan(null);
        }
    };

    const tiers = [
        {
            name: 'Free',
            price: '$0',
            period: '/month',
            description: 'Perfect for getting started',
            features: [
                '20 one-time signup replies',
                '5 free replies daily',
                'Standard AI generation',
                'Basic prompts',
            ],
            cta: 'free',
            badge: null,
        },
        {
            name: 'PRO',
            price: '$9',
            period: '/month',
            description: 'For power users on X & Discord',
            features: [
                '2,000 replies per month',
                '5 free replies daily',
                'Custom prompts',
                'Advanced context analysis',
                'Priority support',
            ],
            cta: 'pro',
            badge: 'MOST POPULAR',
        },
        {
            name: 'ULTRA',
            price: '$24',
            period: '/month',
            description: 'Maximum volume for pros',
            features: [
                '7,000 replies per month',
                '5 free replies daily',
                'Custom prompts',
                'Advanced context analysis',
                'Priority support',
            ],
            cta: 'ultra',
            badge: 'BEST VALUE',
        },
    ];

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

                <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto perspective-[1200px]">
                    {tiers.map((tier) => {
                        const isPro = tier.cta === 'pro';
                        const isUltra = tier.cta === 'ultra';
                        const isPaid = isPro || isUltra;

                        if (isPaid) {
                            return (
                                <div
                                    key={tier.name}
                                    className={`relative rounded-3xl p-[2px] flex flex-col h-full shadow-2xl transform z-10 transition-all duration-300 group ${
                                        isPro
                                            ? 'bg-gradient-to-b from-blue-500 to-purple-600 shadow-purple-500/15 md:scale-105 hover:shadow-purple-500/25'
                                            : 'bg-gradient-to-b from-amber-400 to-orange-500 shadow-orange-400/15 hover:shadow-orange-400/25'
                                    }`}
                                >
                                    {tier.badge && (
                                        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 rounded-full border border-white/20 px-6 py-1 text-xs font-black tracking-wide text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] z-20 ${
                                            isPro
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                                                : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        }`}>
                                            {tier.badge}
                                        </div>
                                    )}

                                    <div className="relative rounded-[22px] p-8 flex flex-col h-full bg-white/95 backdrop-blur-xl">
                                        <div className={`absolute inset-0 rounded-[22px] pointer-events-none ${
                                            isPro ? 'bg-gradient-to-b from-purple-500/5 to-transparent' : 'bg-gradient-to-b from-amber-500/5 to-transparent'
                                        }`} />

                                        <div className="relative z-10 mb-6">
                                            <h3 className={`text-2xl font-bold mb-2 text-transparent bg-clip-text ${
                                                isPro
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                                                    : 'bg-gradient-to-r from-amber-500 to-orange-600'
                                            }`}>
                                                {tier.name}
                                            </h3>
                                            <p className="text-slate-600 font-medium text-sm">{tier.description}</p>
                                        </div>
                                        <div className="relative z-10 mb-8 flex items-baseline gap-2">
                                            <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
                                            <span className="text-slate-500 font-medium">{tier.period}</span>
                                        </div>
                                        <ul className="relative z-10 space-y-4 mb-8 flex-1">
                                            {tier.features.map((feature, i) => (
                                                <li key={i} className="flex items-center text-slate-700 font-semibold">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                                                        isPro ? 'bg-purple-100' : 'bg-amber-100'
                                                    }`}>
                                                        <Check className={`w-4 h-4 ${isPro ? 'text-purple-600' : 'text-amber-600'}`} />
                                                    </div>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="relative z-10">
                                            <Button
                                                onClick={() => handleCheckout(tier.cta as 'pro' | 'ultra')}
                                                disabled={loadingPlan === tier.cta}
                                                className={`w-full rounded-xl py-6 text-white font-bold text-base shadow-lg transition-all hover:scale-[1.02] border-0 flex items-center justify-center gap-2 ${
                                                    isPro
                                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-purple-500/25'
                                                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-orange-400/25'
                                                }`}
                                            >
                                                {loadingPlan === tier.cta ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Connecting...
                                                    </>
                                                ) : (
                                                    `Get Started with ${tier.name}`
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Free tier
                        return (
                            <div key={tier.name} className="relative rounded-3xl p-8 flex flex-col h-full bg-white/50 border border-slate-200 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                                    <p className="text-slate-500 font-medium text-sm">{tier.description}</p>
                                </div>
                                <div className="mb-8">
                                    <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
                                    <span className="text-slate-500 font-medium">{tier.period}</span>
                                </div>
                                <ul className="space-y-4 mb-8 flex-1">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-center text-slate-600 font-medium">
                                            <Check className="w-5 h-5 text-blue-500 mr-3" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <a
                                    href="https://chromewebstore.google.com/detail/atomix-%E2%80%94-ai-replies-for-x/jajfflglndpaipninocbcaphhkgaapog"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => posthog?.capture('pricing_clicked', { plan: 'free' })}
                                    className="group w-full rounded-xl py-6 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-base transition-colors flex items-center justify-center gap-3"
                                >
                                    <ChromeIcon className="w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-[1.15]" />
                                    Add to Chrome — Free
                                </a>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
