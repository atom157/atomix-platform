'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Check, Loader2, Zap, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  plan: string
  subscription_status: string | null
  lava_contract_id: string | null
  generations_count: number
  generations_limit: number
}

interface BillingPlansProps {
  profile: Profile | null
}

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
]

export function BillingPlans({ profile }: BillingPlansProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const currentPlan = profile?.plan || 'free'
  const router = useRouter()

  const handleCheckout = async (plan: 'pro' | 'ultra') => {
    setLoadingPlan(plan)

    if (plan === 'ultra') {
      window.open(
        'https://app.lava.top/products/7f0b7bdd-1d52-4d18-9c30-6c57c5978415/5844220a-5811-4a3b-a15d-f2f735570b4b',
        '_blank'
      )
      setLoadingPlan(null)
      return
    }

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user?.email) {
        console.error('User email not found')
        setLoadingPlan(null)
        return
      }

      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      })

      const data = await response.json()

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        console.error('No payment URL:', data.error)
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoadingPlan(null)
    }
  }

  // Active status header
  const renderActiveStatus = () => {
    if (currentPlan === 'free') return null;

    const isPro = currentPlan === 'pro';
    const isUltra = currentPlan === 'ultra';

    return (
      <Card className={`w-full max-w-2xl mx-auto mb-8 rounded-3xl border bg-gradient-to-br backdrop-blur-xl shadow-lg ${
        isPro 
            ? 'border-purple-200/60 from-white/80 via-purple-50/30 to-white/80 shadow-purple-500/5' 
            : 'border-orange-200/60 from-white/80 via-orange-50/30 to-white/80 shadow-orange-500/5'
      }`}>
        <CardHeader className="text-center pb-2">
          <CardTitle className="flex items-center justify-center gap-3 text-lg">
            <span className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-lg ${
              isPro ? 'shadow-purple-500/30 bg-gradient-to-r from-blue-600 to-purple-600' : 'shadow-orange-500/30 bg-gradient-to-r from-amber-500 to-orange-500'
            }`}>
              <Sparkles className="h-3.5 w-3.5" />
              {isPro ? 'PRO' : 'ULTRA'}
              <span className="absolute inset-0 rounded-full overflow-hidden">
                <span className="absolute inset-0 animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
              </span>
            </span>
            <span className="text-slate-700">Active Subscription</span>
          </CardTitle>
          <CardDescription className="text-center">
            You have <strong>{isPro ? '2,000' : '7,000'} replies per month</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pt-2">
          <a
            href="https://app.lava.top/my-purchases"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold border backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                isPro
                    ? 'text-slate-700 border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/60'
                    : 'text-orange-700 border-orange-200/80 bg-orange-50/50 hover:bg-orange-100/60'
            }`}>
              <Sparkles className="h-4 w-4" />
              Manage Subscription
            </button>
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full pb-12">
      {renderActiveStatus()}

      <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2 w-full max-w-5xl mx-auto align-top">
        {tiers.map((tier) => {
          const isPro = tier.cta === 'pro';
          const isUltra = tier.cta === 'ultra';
          const isPaid = isPro || isUltra;
          const isActivePlan = currentPlan === tier.cta;

          if (isPaid) {
            return (
              <div
                key={tier.name}
                className={`relative rounded-3xl p-[2px] flex flex-col h-full shadow-2xl transform z-10 transition-all duration-300 group ${
                  isPro
                    ? 'bg-gradient-to-b from-blue-500 to-purple-600 shadow-purple-500/15 hover:shadow-purple-500/25'
                    : 'bg-gradient-to-b from-amber-400 to-orange-500 shadow-orange-400/15 hover:shadow-orange-400/25'
                } ${isActivePlan ? 'ring-2 ring-offset-4 ring-slate-800 scale-[1.02] md:scale-[1.05]' : ''}`}
              >
                {tier.badge && !isActivePlan && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 px-6 py-1 text-xs font-black tracking-wide text-white z-20 ${
                    isPro
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  }`}>
                    {tier.badge}
                  </div>
                )}

                {isActivePlan && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-800 px-6 py-1 text-xs font-black tracking-wide text-white z-20 bg-slate-800 shadow-[0_0_20px_rgba(15,23,42,0.4)]">
                    CURRENT PLAN
                  </div>
                )}

                <div className="relative rounded-[22px] p-8 flex flex-col h-full bg-white/95 backdrop-blur-xl">
                  <div className={`absolute inset-0 rounded-[22px] pointer-events-none ${
                    isPro ? 'bg-gradient-to-b from-purple-500/5 to-transparent' : 'bg-gradient-to-b from-amber-500/5 to-transparent'
                  }`} />

                  <div className="relative z-10 mb-6 text-center">
                    <h3 className={`text-2xl font-bold mb-2 text-transparent bg-clip-text ${
                      isPro
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600'
                    }`}>
                      {tier.name}
                    </h3>
                    <p className="text-slate-600 font-medium text-sm">{tier.description}</p>
                  </div>
                  <div className="relative z-10 mb-8 flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
                    <span className="text-slate-500 font-medium">{tier.period}</span>
                  </div>
                  <ul className="relative z-10 space-y-4 mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-slate-700 font-semibold text-sm leading-tight">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                          isPro ? 'bg-purple-100' : 'bg-amber-100'
                        }`}>
                          <Check className={`w-4 h-4 ${isPro ? 'text-purple-600' : 'text-amber-600'}`} />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="relative z-10 mt-auto">
                    {isActivePlan ? (
                      <Button className="w-full rounded-xl py-6 bg-slate-100 hover:bg-slate-200 text-slate-400 font-bold border-0 cursor-not-allowed">
                        Active Plan
                      </Button>
                    ) : (
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
                          <>
                            <Zap className="mr-2 w-5 h-5" />
                            Upgrade to {tier.name}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // Free tier
          return (
            <div key={tier.name} className={`relative rounded-3xl p-8 flex flex-col h-full bg-white border border-slate-200 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
              isActivePlan ? 'ring-2 ring-slate-800 ring-offset-4' : ''
            }`}>
              {isActivePlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-800 px-6 py-1 text-xs font-black tracking-wide text-white z-20 bg-slate-800 shadow-[0_0_20px_rgba(15,23,42,0.4)]">
                  CURRENT PLAN
                </div>
              )}
              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2 mt-2">{tier.name}</h3>
                <p className="text-slate-500 font-medium text-sm">{tier.description}</p>
              </div>
              <div className="mb-8 flex justify-center items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
                <span className="text-slate-500 font-medium">{tier.period}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-slate-600 font-medium text-sm leading-tight">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 bg-slate-100">
                      <Check className="w-4 h-4 text-slate-600" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="relative z-10 mt-auto">
                <Button className="w-full rounded-xl py-6 bg-slate-100 font-bold hover:bg-slate-100 text-slate-400 cursor-not-allowed border-0">
                  {isActivePlan ? 'Active Plan' : 'Free Forever'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
