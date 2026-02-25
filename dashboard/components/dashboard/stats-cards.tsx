'use client'

import useSWR from 'swr'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Zap, TrendingUp } from 'lucide-react'

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

  const stats = [
    {
      title: 'Replies This Month',
      value: `${used} / ${limit}`,
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`,
      icon: MessageSquare,
      accent: 'from-blue-500 to-indigo-600',
      iconBg: 'bg-blue-50 text-blue-600',
      glowColor: 'hover:shadow-blue-500/10',
      extra: (
        <div className="mt-3 h-2 w-full rounded-full bg-slate-100/80 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-700 ease-out ${percentage > 90 ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-sm shadow-red-500/50' : 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm shadow-blue-500/50'}`}
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
      accent: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-50 text-violet-600',
      glowColor: 'hover:shadow-violet-500/10',
    },
    {
      title: '7-Day Trend',
      value: isLoading ? null : `${trendPct >= 0 ? '+' : ''}${trendPct}%`,
      description: `${last7Total} replies this week`,
      icon: TrendingUp,
      accent: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-50 text-emerald-600',
      glowColor: 'hover:shadow-emerald-500/10',
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="group relative rounded-3xl border border-white/60 bg-white/50 shadow-sm backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-2xl hover:border-white/80"
        >
          {/* Subtle top gradient accent bar */}
          <div className={`absolute inset-x-0 top-0 h-[3px] rounded-t-3xl bg-gradient-to-r ${stat.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {stat.title}
            </CardTitle>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            {stat.value === null ? (
              <Skeleton className="h-9 w-28 bg-slate-100/80 rounded-lg" />
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
