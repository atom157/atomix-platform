'use client'

import useSWR from 'swr'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface DailyData {
  date: string
  label: string
  replies: number
  tokens: number
}

interface AnalyticsData {
  dailyUsage: DailyData[]
  modelUsage: { model: string; count: number }[]
  totalReplies: number
  totalTokens: number
  recentActivity: {
    id: string
    tweet_text: string | null
    generated_reply: string | null
    model: string
    tokens_used: number
    created_at: string
  }[]
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
        <p className="text-sm font-medium text-card-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].value} {payload[0].value === 1 ? 'reply' : 'replies'}
        </p>
      </div>
    )
  }
  return null
}

export function UsageChart() {
  const { data, isLoading } = useSWR<AnalyticsData>(
    '/api/dashboard/analytics',
    fetcher,
    { refreshInterval: 60000 }
  )

  if (isLoading) {
    return (
      <Card className="col-span-1 border border-white/60 bg-white/50 shadow-sm backdrop-blur-xl rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">Daily Usage</CardTitle>
          <CardDescription className="text-sm font-medium text-slate-500">Replies generated over the last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full bg-slate-100" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data?.dailyUsage || []
  const maxReplies = Math.max(...chartData.map((d) => d.replies), 1)

  return (
    <Card className="col-span-1 border border-white/60 bg-white/50 shadow-sm backdrop-blur-xl rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/5 hover:border-white/80 hover:-translate-y-0.5">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-900">Daily Usage</CardTitle>
        <CardDescription className="text-sm font-medium text-slate-500">Replies generated over the last 14 days</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.every((d) => d.replies === 0) ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-sm text-slate-500 font-medium">
              No usage data yet. Start generating replies from the extension!
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-slate-100"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                className="text-xs font-semibold fill-slate-500"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-xs font-semibold fill-slate-500"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                domain={[0, Math.ceil(maxReplies * 1.1)]}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} // slate-100 opacity
              />
              <Bar
                dataKey="replies"
                fill="url(#colorReplies)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
