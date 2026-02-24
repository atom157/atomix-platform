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
import { Check, Zap } from 'lucide-react'

interface Profile {
  id: string
  plan: string
  subscription_status: string | null
  lemonsqueezy_customer_id: string | null
  lemonsqueezy_subscription_id: string | null
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
    variantId: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'For power users on X',
    features: [
      'Unlimited AI replies per month',
      'Unlimited custom prompts',
      'Priority support',
      'Analytics dashboard',
    ],
    variantId: process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID,
    popular: true,
  },
];

export function BillingPlans({ profile }: BillingPlansProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const currentPlan = profile?.plan || 'free'

  const handleSubscribe = async (variantId: string | null | undefined, planId: string) => {
    if (!variantId) return

    setIsLoading(planId)

    try {
      const response = await fetch('/api/lemonsqueezy/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      })

      const data = await response.json()

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading('manage')

    try {
      const response = await fetch('/api/lemonsqueezy/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.portalUrl) {
        window.location.href = data.portalUrl
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {profile?.subscription_status === 'active' && currentPlan !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              You are currently on the <strong className="capitalize">{currentPlan}</strong> plan
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Replies used this month: {profile.generations_count} / {profile.generations_limit}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isLoading === 'manage'}
            >
              {isLoading === 'manage' ? 'Loading...' : 'Manage Subscription'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${plan.popular ? 'border-primary shadow-md' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.name}
                {currentPlan === plan.id && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {currentPlan === plan.id ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : plan.variantId ? (
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.variantId, plan.id)}
                  disabled={isLoading === plan.id}
                >
                  {isLoading === plan.id ? (
                    'Loading...'
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Upgrade to {plan.name}
                    </>
                  )}
                </Button>
              ) : (
                <Button className="w-full bg-transparent" variant="outline" disabled>
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
