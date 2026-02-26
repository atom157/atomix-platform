'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Infinity, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '20 AI replies per month',
      '3 custom prompts',
      'Basic support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'For power users on X',
    features: [
      'Unlimited AI replies',
      'Unlimited custom prompts',
      'Priority support',
      'Analytics dashboard',
    ],
    popular: true,
  },
]

export function BillingPlans({ profile }: BillingPlansProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const currentPlan = profile?.plan || 'free'
  const isPro = currentPlan === 'pro'

  const handleUpgrade = async () => {
    setIsLoading('pro')

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.email) {
        console.error('User email not found');
        setIsLoading(null);
        return;
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
      setIsLoading(null)
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* ── Pro Status Card ── */}
      {isPro && profile?.subscription_status === 'active' && (
        <Card className="w-full max-w-2xl rounded-3xl border border-purple-200/60 bg-gradient-to-br from-white/80 via-purple-50/30 to-white/80 backdrop-blur-xl shadow-lg shadow-purple-500/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-3 text-lg">
              {/* ── Animated PRO Badge ── */}
              <span className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-lg shadow-purple-500/30"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #D946EF)',
                }}>
                <Sparkles className="h-3.5 w-3.5" />
                PRO
                {/* Shimmer overlay */}
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
              You have <strong>unlimited</strong> AI replies
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Infinity className="h-4 w-4 text-purple-600" />
              <span>{profile.generations_count} replies generated this month</span>
            </div>
            <a
              href="https://app.lava.top/my-purchases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-purple-700 border border-purple-200/80 bg-purple-50/50 backdrop-blur-sm transition-all duration-300 hover:bg-purple-100/60 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98]">
                <Sparkles className="h-4 w-4" />
                Manage Subscription
              </button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* ── Plan Cards ── */}
      <div className="grid gap-8 md:grid-cols-2 w-full max-w-2xl">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.popular
              ? 'border-purple-200 bg-gradient-to-b from-white to-purple-50/30 shadow-md shadow-purple-500/5'
              : 'border-white/60 bg-white/50 backdrop-blur-xl shadow-sm'
              }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-none shadow-md shadow-purple-500/20 px-4">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                {plan.name}
                {currentPlan === plan.id && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-xs">Current</Badge>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-5">
                <span className="text-5xl font-bold tracking-tight text-slate-900">{plan.price}</span>
                <span className="text-muted-foreground ml-1 text-sm">/{plan.period}</span>
              </div>
              <ul className="space-y-3 text-left">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-2">
              {currentPlan === plan.id ? (
                <Button className="w-full rounded-xl h-11" disabled>
                  Current Plan
                </Button>
              ) : plan.id === 'pro' ? (
                <Button
                  className="w-full rounded-xl h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-md shadow-purple-500/20 transition-all text-base"
                  onClick={handleUpgrade}
                  disabled={isLoading === 'pro'}
                >
                  {isLoading === 'pro' ? (
                    'Redirecting...'
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </>
                  )}
                </Button>
              ) : (
                <Button className="w-full rounded-xl h-11" variant="outline" disabled>
                  Free Forever
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* ── Shimmer keyframes ── */}
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
