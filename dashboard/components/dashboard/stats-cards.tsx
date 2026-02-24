'use client'

import useSWR from 'swr'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Cpu, Zap, TrendingUp } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface AnalyticsData {
  totalReplies: number
  totalTokens: number
  modelUsage: { model: string; count: number }[]
  dailyUsage: { replies: number }[]
}

export function StatsCards({
  plan,
  used,
  limit,
}: {
  plan: string
  used: number
  limit: number
}) {
  const { data, isLoading } = useSWR<AnalyticsData>(
    '/api/dashboard/analytics',
    fetcher,
    { refreshInterval: 60000 }
  )

  const percentage = Math.min((used / limit) * 100, 100)

  // Calculate 7-day trend
  const dailyUsage = data?.dailyUsage || []
  const last7 = dailyUsage.slice(-7)
  const prev7 = dailyUsage.slice(-14, -7)
  const last7Total = last7.reduce((s, d) => s + d.replies, 0)
  const prev7Total = prev7.reduce((s, d) => s + d.replies, 0)
  const trendPct =
    prev7Total > 0
      ? Math.round(((last7Total - prev7Total) / prev7Total) * 100)
      : last7Total > 0
        ? 100
        : 0

  const topModel = data?.modelUsage?.sort((a, b) => b.count - a.count)[0]?.model || 'N/A'

  const stats = [
    {
      title: 'Replies This Month',
      value: `${used} / ${limit}`,
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`,
      icon: MessageSquare,
      extra: (
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all ${percentage > 90 ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-sm shadow-red-500/50' : 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm shadow-blue-500/50'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      ),
    },
    {
      title: 'Last 30 Days',
      value: isLoading ? null : String(data?.totalReplies ?? 0),
      description: 'Total replies generated',
      icon: Zap,
    },
    {
      title: '7-Day Trend',
      value: isLoading ? null : `${trendPct >= 0 ? '+' : ''}${trendPct}%`,
      description: `${last7Total} replies this week`,
      icon: TrendingUp,
    },
    {
      title: 'Top Model',
      value: isLoading ? null : topModel.replace('gpt-', 'GPT-'),
      description: isLoading
        ? ''
        : `${data?.totalTokens?.toLocaleString() ?? 0} tokens used`,
      icon: Cpu,
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="rounded-3xl border border-slate-100 bg-white/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 hover:border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {stat.title}
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <stat.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {stat.value === null ? (
              <Skeleton className="h-8 w-24 bg-slate-100" />
            ) : (
              <div className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</div>
            )}
            <p className="text-sm font-medium text-slate-500 mt-2">
              {stat.description}
            </p>
            {stat.extra}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
