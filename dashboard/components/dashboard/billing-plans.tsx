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
import { Check, Zap, Infinity } from 'lucide-react'

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
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="flex flex-col gap-6">
      {isPro && profile?.subscription_status === 'active' && (
        <Card className="rounded-3xl border border-white/60 bg-white/50 backdrop-blur-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Subscription
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">Pro</Badge>
            </CardTitle>
            <CardDescription>
              You have <strong>unlimited</strong> AI replies
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Infinity className="h-4 w-4 text-purple-600" />
              <span>{profile.generations_count} replies generated this month</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.popular
                ? 'border-purple-200 bg-gradient-to-b from-white to-purple-50/30 shadow-md shadow-purple-500/5'
                : 'border-white/60 bg-white/50 backdrop-blur-xl shadow-sm'
              }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none shadow-md shadow-purple-500/20">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.name}
                {currentPlan === plan.id && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none">Current</Badge>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight text-slate-900">{plan.price}</span>
                <span className="text-muted-foreground ml-1">/{plan.period}</span>
              </div>
              <ul className="space-y-2.5">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {currentPlan === plan.id ? (
                <Button className="w-full rounded-xl" disabled>
                  Current Plan
                </Button>
              ) : plan.id === 'pro' ? (
                <Button
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-purple-500/20 transition-all"
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
                <Button className="w-full rounded-xl" variant="outline" disabled>
                  Free Forever
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
